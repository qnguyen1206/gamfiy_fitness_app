import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import { Camera, StopCircle } from 'lucide-react';

interface ExerciseDetectorProps {
  exerciseType: 'pushup' | 'situp';
  onCountUpdate: (count: number) => void;
  onFinish: (count: number) => void;
  onClose: () => void;
}

const ExerciseDetector: React.FC<ExerciseDetectorProps> = ({ exerciseType, onCountUpdate, onFinish, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const [status, setStatus] = useState<string>('Initializing...');
  const [hasError, setHasError] = useState(false);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const animationFrameRef = useRef<number>();
  const exerciseStateRef = useRef<'up' | 'down'>('up');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        setStatus('Loading AI model...');
        await tf.ready();
        
        setStatus('Requesting camera access...');
        console.log('Requesting camera access...');
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });

        console.log('Camera access granted, stream:', stream);
        setStatus('Camera connected! Loading...');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((resolve, reject) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                console.log('Video metadata loaded');
                resolve(true);
              };
              videoRef.current.onerror = (e) => {
                console.error('Video error:', e);
                reject(e);
              };
            }
          });
          await videoRef.current.play();
          console.log('Video playing');
        }

        setStatus('Loading pose detection model...');
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: 'SinglePose.Lightning'
        };
        
        const detector = await poseDetection.createDetector(model, detectorConfig);
        detectorRef.current = detector;
        console.log('Detector created successfully');
        setIsDetecting(true);
        setStatus('Ready! Start your exercise');
        detectPose();
      } catch (error: any) {
        console.error('Error setting up camera:', error);
        setHasError(true);
        if (error.name === 'NotAllowedError') {
          setStatus('Camera permission denied. Please allow camera access and refresh.');
        } else if (error.name === 'NotFoundError') {
          setStatus('No camera found. Please connect a camera and try again.');
        } else if (error.name === 'NotReadableError') {
          setStatus('Camera is in use by another application.');
        } else {
          setStatus(`Error: ${error.message || 'Could not access camera'}`);
        }
      }
    };

    const calculateAngle = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => {
      const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
      let angle = Math.abs((radians * 180.0) / Math.PI);
      if (angle > 180.0) {
        angle = 360 - angle;
      }
      return angle;
    };

    const detectPose = async () => {
      if (!detectorRef.current || !videoRef.current || !canvasRef.current) return;

      try {
        const poses = await detectorRef.current.estimatePoses(videoRef.current);
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        if (poses.length > 0) {
          const keypoints = poses[0].keypoints;
          
          // Draw skeleton
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 2;
          keypoints.forEach(keypoint => {
            if (keypoint.score && keypoint.score > 0.3) {
              ctx.beginPath();
              ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
              ctx.fillStyle = '#FF0000';
              ctx.fill();
            }
          });

          // Get required keypoints
          const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
          const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
          const leftElbow = keypoints.find(kp => kp.name === 'left_elbow');
          const rightElbow = keypoints.find(kp => kp.name === 'right_elbow');
          const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
          const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
          const leftHip = keypoints.find(kp => kp.name === 'left_hip');
          const leftKnee = keypoints.find(kp => kp.name === 'left_knee');

          if (exerciseType === 'pushup') {
            // Push-up detection logic
            if (leftShoulder && leftElbow && leftWrist && 
                rightShoulder && rightElbow && rightWrist) {
              const leftArmAngle = calculateAngle(
                { x: leftShoulder.x, y: leftShoulder.y },
                { x: leftElbow.x, y: leftElbow.y },
                { x: leftWrist.x, y: leftWrist.y }
              );
              const rightArmAngle = calculateAngle(
                { x: rightShoulder.x, y: rightShoulder.y },
                { x: rightElbow.x, y: rightElbow.y },
                { x: rightWrist.x, y: rightWrist.y }
              );
              const avgAngle = (leftArmAngle + rightArmAngle) / 2;

              if (avgAngle < 100 && exerciseStateRef.current === 'up') {
                exerciseStateRef.current = 'down';
                setStatus('Down position');
              } else if (avgAngle > 160 && exerciseStateRef.current === 'down') {
                exerciseStateRef.current = 'up';
                countRef.current += 1;
                const newCount = countRef.current;
                setCount(newCount);
                onCountUpdate(newCount);
                setStatus(`Push-up ${newCount}!`);
              }
            }
          } else if (exerciseType === 'situp') {
            // Sit-up detection logic
            if (leftShoulder && leftHip && leftKnee) {
              const bodyAngle = calculateAngle(
                { x: leftShoulder.x, y: leftShoulder.y },
                { x: leftHip.x, y: leftHip.y },
                { x: leftKnee.x, y: leftKnee.y }
              );

              if (bodyAngle < 50 && exerciseStateRef.current === 'up') {
                exerciseStateRef.current = 'down';
                setStatus('Down position');
              } else if (bodyAngle > 80 && exerciseStateRef.current === 'down') {
                exerciseStateRef.current = 'up';
                countRef.current += 1;
                const newCount = countRef.current;
                setCount(newCount);
                onCountUpdate(newCount);
                setStatus(`Sit-up ${newCount}!`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error detecting pose:', error);
      }

      animationFrameRef.current = requestAnimationFrame(detectPose);
    };

    setupCamera();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
    };
  }, []);

  const handleFinish = () => {
    onFinish(countRef.current);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {exerciseType === 'pushup' ? 'Push-up' : 'Sit-up'} Detection
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side - Video */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="hidden"
                width="640"
                height="480"
                playsInline
              />
              <canvas
                ref={canvasRef}
                width="640"
                height="480"
                className="w-full h-auto"
              />
              
              {!isDetecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                  <div className="text-white text-center">
                    <Camera size={48} className="mx-auto mb-4" />
                    <p className="text-xl mb-4">{status}</p>
                    {hasError && (
                      <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Controls and Info */}
            <div className="flex flex-col gap-4">
              {/* Buttons */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <button
                  onClick={handleFinish}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-lg"
                >
                  Finish & Save
                </button>
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-lg"
                >
                  <StopCircle size={24} />
                  Cancel
                </button>
              </div>

              {/* Stats */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-gray-600 text-sm">Count</p>
                    <p className="text-4xl font-bold">{count}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Status</p>
                    <p className="text-lg font-semibold">{status}</p>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <p className="font-semibold mb-2 text-blue-900">Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  {exerciseType === 'pushup' ? (
                    <>
                      <li>Position yourself so your full body is visible</li>
                      <li>Keep your body straight during the exercise</li>
                      <li>Go down until arms are at 90 degrees</li>
                    </>
                  ) : (
                    <>
                      <li>Lie on your back with knees bent</li>
                      <li>Make sure your upper body is visible</li>
                      <li>Lift your torso towards your knees</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetector;
