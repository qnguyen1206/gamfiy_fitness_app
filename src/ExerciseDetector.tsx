import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import { Camera, StopCircle } from 'lucide-react';

interface ExerciseDetectorProps {
  exerciseType: 'pushup' | 'situp' | 'squat' | 'plank' | 'lunge' | 'swordstrike';
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
  const [formFeedback, setFormFeedback] = useState<string>('');
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const animationFrameRef = useRef<number>();
  const exerciseStateRef = useRef<'up' | 'down'>('up');
  const confidenceThreshold = 0.5; // Minimum confidence for keypoint detection

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
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER
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
            if (keypoint.score && keypoint.score > confidenceThreshold) {
              ctx.beginPath();
              ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
              ctx.fillStyle = keypoint.score > 0.7 ? '#00FF00' : '#FFA500'; // Green for high confidence, orange for medium
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
            // Push-up detection logic with confidence checking
            if (leftShoulder && leftElbow && leftWrist && 
                rightShoulder && rightElbow && rightWrist &&
                leftShoulder.score! > confidenceThreshold &&
                leftElbow.score! > confidenceThreshold &&
                leftWrist.score! > confidenceThreshold &&
                rightShoulder.score! > confidenceThreshold &&
                rightElbow.score! > confidenceThreshold &&
                rightWrist.score! > confidenceThreshold) {
              
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

              // Form feedback
              if (Math.abs(leftArmAngle - rightArmAngle) > 30) {
                setFormFeedback('⚠️ Keep arms balanced');
              } else if (avgAngle < 160 && avgAngle > 100) {
                setFormFeedback('💪 Good form!');
              } else {
                setFormFeedback('');
              }

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
            } else {
              setFormFeedback('📷 Position yourself fully in frame');
            }
          } else if (exerciseType === 'situp') {
            // Sit-up detection logic with confidence checking
            if (leftShoulder && leftHip && leftKnee &&
                leftShoulder.score! > confidenceThreshold &&
                leftHip.score! > confidenceThreshold &&
                leftKnee.score! > confidenceThreshold) {
              
              const bodyAngle = calculateAngle(
                { x: leftShoulder.x, y: leftShoulder.y },
                { x: leftHip.x, y: leftHip.y },
                { x: leftKnee.x, y: leftKnee.y }
              );

              if (bodyAngle < 50 && exerciseStateRef.current === 'up') {
                exerciseStateRef.current = 'down';
                setStatus('Down position');
                setFormFeedback('');
              } else if (bodyAngle > 80 && exerciseStateRef.current === 'down') {
                exerciseStateRef.current = 'up';
                countRef.current += 1;
                const newCount = countRef.current;
                setCount(newCount);
                onCountUpdate(newCount);
                setStatus(`Sit-up ${newCount}!`);
                setFormFeedback('💪 Great rep!');
              } else if (bodyAngle > 50 && bodyAngle < 80) {
                setFormFeedback('Keep going!');
              }
            } else {
              setFormFeedback('📷 Make sure upper body is visible');
            }
          } else if (exerciseType === 'squat') {
            // Squat detection logic with confidence checking
            const rightHip = keypoints.find(kp => kp.name === 'right_hip');
            const rightKnee = keypoints.find(kp => kp.name === 'right_knee');
            const rightAnkle = keypoints.find(kp => kp.name === 'right_ankle');

            if (leftHip && leftKnee && rightHip && rightKnee && rightAnkle &&
                leftHip.score! > confidenceThreshold &&
                leftKnee.score! > confidenceThreshold &&
                rightHip.score! > confidenceThreshold &&
                rightKnee.score! > confidenceThreshold &&
                rightAnkle.score! > confidenceThreshold) {
              
              const leftLegAngle = calculateAngle(
                { x: leftHip.x, y: leftHip.y },
                { x: leftKnee.x, y: leftKnee.y },
                { x: leftKnee.x, y: leftKnee.y + 100 }
              );
              const rightLegAngle = calculateAngle(
                { x: rightHip.x, y: rightHip.y },
                { x: rightKnee.x, y: rightKnee.y },
                { x: rightAnkle.x, y: rightAnkle.y }
              );
              const avgAngle = (leftLegAngle + rightLegAngle) / 2;

              if (avgAngle < 110 && avgAngle > 70) {
                setFormFeedback('💪 Good depth!');
              } else if (avgAngle < 70) {
                setFormFeedback('⚠️ Too low - protect your knees');
              } else {
                setFormFeedback('');
              }

              if (avgAngle < 110 && exerciseStateRef.current === 'up') {
                exerciseStateRef.current = 'down';
                setStatus('Squat down');
              } else if (avgAngle > 160 && exerciseStateRef.current === 'down') {
                exerciseStateRef.current = 'up';
                countRef.current += 1;
                const newCount = countRef.current;
                setCount(newCount);
                onCountUpdate(newCount);
                setStatus(`Squat ${newCount}!`);
              }
            } else {
              setFormFeedback('📷 Stand facing the camera');
            }
          } else if (exerciseType === 'plank') {
            // Plank hold time detection
            if (leftShoulder && leftHip && leftKnee) {
              const bodyAngle = calculateAngle(
                { x: leftShoulder.x, y: leftShoulder.y },
                { x: leftHip.x, y: leftHip.y },
                { x: leftKnee.x, y: leftKnee.y }
              );

              // Plank is held when body is straight (160-180 degrees)
              if (bodyAngle > 160 && bodyAngle < 200) {
                if (exerciseStateRef.current === 'up') {
                  exerciseStateRef.current = 'down';
                  countRef.current += 1;
                  const newCount = countRef.current;
                  setCount(newCount);
                  onCountUpdate(newCount);
                }
                setStatus('Holding plank...');
              } else {
                exerciseStateRef.current = 'up';
                setStatus('Get into plank position');
              }
            }
          } else if (exerciseType === 'lunge') {
            // Lunge detection logic
            const rightHip = keypoints.find(kp => kp.name === 'right_hip');
            const rightKnee = keypoints.find(kp => kp.name === 'right_knee');
            const rightAnkle = keypoints.find(kp => kp.name === 'right_ankle');

            if (leftKnee && leftHip && rightKnee) {
              const leftLegAngle = calculateAngle(
                { x: leftHip.x, y: leftHip.y },
                { x: leftKnee.x, y: leftKnee.y },
                { x: leftKnee.x, y: leftKnee.y + 100 }
              );

              if (leftLegAngle < 100 && exerciseStateRef.current === 'up') {
                exerciseStateRef.current = 'down';
                setStatus('Lunge down');
              } else if (leftLegAngle > 160 && exerciseStateRef.current === 'down') {
                exerciseStateRef.current = 'up';
                countRef.current += 1;
                const newCount = countRef.current;
                setCount(newCount);
                onCountUpdate(newCount);
                setStatus(`Lunge ${newCount}!`);
              }
            }
          } else if (exerciseType === 'swordstrike') {
            // Sword strike detection logic
            const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
            const rightElbow = keypoints.find(kp => kp.name === 'right_elbow');
            const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
            const nose = keypoints.find(kp => kp.name === 'nose');

            if (rightShoulder && rightElbow && rightWrist && nose &&
                rightShoulder.score! > confidenceThreshold &&
                rightElbow.score! > confidenceThreshold &&
                rightWrist.score! > confidenceThreshold) {
              
              const armAngle = calculateAngle(
                { x: rightShoulder.x, y: rightShoulder.y },
                { x: rightElbow.x, y: rightElbow.y },
                { x: rightWrist.x, y: rightWrist.y }
              );

              // Check if wrist is above shoulder (raised position)
              const wristAboveShoulder = rightWrist.y < rightShoulder.y - 50;
              // Check if wrist is below shoulder (strike position)
              const wristBelowShoulder = rightWrist.y > rightShoulder.y + 30;

              if (wristAboveShoulder && armAngle > 140) {
                setFormFeedback('⚔️ Ready to strike!');
              }

              if (wristAboveShoulder && exerciseStateRef.current === 'down') {
                exerciseStateRef.current = 'up';
                setStatus('Raised - ready!');
              } else if (wristBelowShoulder && exerciseStateRef.current === 'up') {
                exerciseStateRef.current = 'down';
                countRef.current += 1;
                const newCount = countRef.current;
                setCount(newCount);
                onCountUpdate(newCount);
                setStatus(`Strike ${newCount}!`);
                setFormFeedback('💥 Good strike!');
              }
            } else {
              setFormFeedback('📷 Stand side-facing to camera');
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
            {exerciseType === 'pushup' ? 'Push-up' : 
             exerciseType === 'situp' ? 'Sit-up' : 
             exerciseType === 'squat' ? 'Squat' : 
             exerciseType === 'plank' ? 'Plank' : 
             exerciseType === 'lunge' ? 'Lunge' : 'Sword Strike'} Detection
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
                {formFeedback && (
                  <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg text-center">
                    <p className="text-blue-900 font-semibold">{formFeedback}</p>
                  </div>
                )}
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
                  ) : exerciseType === 'situp' ? (
                    <>
                      <li>Lie on your back with knees bent</li>
                      <li>Make sure your upper body is visible</li>
                      <li>Lift your torso towards your knees</li>
                    </>
                  ) : exerciseType === 'squat' ? (
                    <>
                      <li>Stand facing the camera</li>
                      <li>Keep feet shoulder-width apart</li>
                      <li>Lower until thighs are parallel to ground</li>
                    </>
                  ) : exerciseType === 'plank' ? (
                    <>
                      <li>Position yourself side-facing to camera</li>
                      <li>Keep body straight from head to heels</li>
                      <li>Hold the position - each second counts!</li>
                    </>
                  ) : exerciseType === 'lunge' ? (
                    <>
                      <li>Stand facing the camera</li>
                      <li>Step forward and lower your hips</li>
                      <li>Keep front knee at 90 degrees</li>
                    </>
                  ) : (
                    <>
                      <li>Stand side-facing to camera</li>
                      <li>Raise your arm above your head</li>
                      <li>Strike down in a swift motion</li>
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
