import { useRef, useState, useEffect } from 'react';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (photoData: string) => void;
}

export function PhotoUploadModal({ isOpen, onClose, onPhotoSelected }: PhotoUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isWebcamMode, setIsWebcamMode] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);

  // Handle setting stream to video element after DOM updates
  useEffect(() => {
    if (!isWebcamMode || !pendingStreamRef.current || !videoRef.current) return;

    const setupWebcam = async () => {
      const stream = pendingStreamRef.current;
      const video = videoRef.current;

      if (!stream || !video) return;

      // Ensure muted is set (required for autoplay with MediaStream)
      video.muted = true;

      // Attach the stream to the video element
      video.srcObject = stream;
      setWebcamStream(stream);
      pendingStreamRef.current = null;

      // Play the video
      video.play().catch(e => console.error('Failed to play video:', e));
    };

    setupWebcam();
  }, [isWebcamMode]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onPhotoSelected(result);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      // Store stream in ref and trigger mode change
      pendingStreamRef.current = stream;
      setIsWebcamMode(true);
    } catch (error: any) {
      let message = 'Unable to access webcam. Please check permissions.';
      if (error?.name === 'NotAllowedError') {
        message = 'Camera permission denied. Please enable camera access in your browser settings.';
      } else if (error?.name === 'NotFoundError') {
        message = 'No camera found on this device.';
      } else if (error?.name === 'NotReadableError') {
        message = 'Camera is in use by another application.';
      }

      alert(message);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Wait for video dimensions to be available
      let attempts = 0;
      while ((video.videoWidth === 0 || video.videoHeight === 0) && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert('Unable to capture photo. Please ensure camera is ready.');
        return;
      }

      const context = canvas.getContext('2d');
      if (context) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame onto the canvas (mirrored)
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0);

        // Convert to data URL
        const photoData = canvas.toDataURL('image/jpeg', 0.95);

        onPhotoSelected(photoData);
        stopWebcam();
        onClose();
      }
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
      setIsWebcamMode(false);
      setIsVideoReady(false);
    }
  };

  const handleCancel = () => {
    stopWebcam();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="photo-modal-overlay" onClick={handleCancel}>
      <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Your Photo</h3>
          <button type="button" className="close-modal-btn" onClick={handleCancel}>✕</button>
        </div>

        <div className="modal-content">
          {!isWebcamMode ? (
            <div className="upload-options">
              <button
                type="button"
                className="option-btn webcam-option"
                onClick={(e) => {
                  e.preventDefault();
                  startWebcam();
                }}
              >
                <span className="option-icon">🎥</span>
                <div>
                  <span className="option-text">Use Webcam</span>
                  <span className="option-desc">Take a photo now</span>
                </div>
              </button>

              <button
                type="button"
                className="option-btn upload-option"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
              >
                <span className="option-icon">📁</span>
                <div>
                  <span className="option-text">Upload Photo</span>
                  <span className="option-desc">Choose from device</span>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="webcam-container">
              <div className="webcam-video-wrapper">
                <video
                  ref={videoRef}
                  className="webcam-video"
                  muted
                  playsInline
                  onLoadedMetadata={() => setIsVideoReady(true)}
                  onCanPlay={() => setIsVideoReady(true)}
                  onPlaying={() => setIsVideoReady(true)}
                />
                {!isVideoReady && (
                  <div className="webcam-loading">
                    <span>📷 Starting camera...</span>
                  </div>
                )}
              </div>
              <div className="webcam-controls">
                <button
                  type="button"
                  className="capture-btn"
                  onClick={capturePhoto}
                  disabled={!isVideoReady}
                >
                  📸 Snap!
                </button>
                <button type="button" className="cancel-webcam-btn" onClick={stopWebcam}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
