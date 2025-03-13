import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const MeetingRoom = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsJoined(true);
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    startCall();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center p-6">
      <h1 className="text-4xl font-extrabold mb-6">Meeting Room: {roomId}</h1>

      <div className="flex space-x-6">
        {/* Local Video */}
        <video ref={localVideoRef} autoPlay playsInline className="w-1/3 rounded-lg shadow-lg border-2 border-white" />
        
        {/* Remote Video (for now, just a placeholder) */}
        <video ref={remoteVideoRef} autoPlay playsInline className="w-1/3 rounded-lg shadow-lg border-2 border-white bg-black" />
      </div>

      {!isJoined && <p className="mt-4 text-red-400">Waiting for permission to access camera & mic...</p>}
    </div>
  );
};

export default MeetingRoom;