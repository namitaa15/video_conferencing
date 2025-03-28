import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const MeetingRoom = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socket = useRef(null);
  const peerConnection = useRef(null);
  const userStream = useRef(null);
  const isHost = useRef(false); // 👑 Host flag

  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pendingUsers, setPendingUsers] = useState([]); // 🚪 Join requests

  const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        userStream.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setIsJoined(true);
        socket.current = io("http://localhost:5001");

        socket.current.on("connect", () => {
          console.log("✅ Connected to socket:", socket.current.id);

          // 👑 First user becomes host
          if (!peerConnection.current) {
            isHost.current = true;
            console.log("👑 You are the host");
          }

          // Host: no emit on connect, waits for approval
          // Others: send join request
          socket.current.emit("join-meeting", {
            meetingId: roomId,
            userId: socket.current.id,
          });
        });

        // 💬 Chat
        socket.current.on("chat-message", ({ userId, message }) => {
          setMessages((prev) => [...prev, { userId, message }]);
        });

        // 🚪 Host gets join requests
        socket.current.on("request-join", ({ userId }) => {
          if (isHost.current) {
            setPendingUsers((prev) => [...prev, userId]);
          }
        });

        // 🚪 Non-host receives approval/denial
        socket.current.on("approved", () => {
          console.log("✅ Approved to join");
          socket.current.emit("ready-to-connect", { meetingId: roomId });
        });

        socket.current.on("denied", () => {
          alert("❌ Access denied by host.");
          window.location.href = "/";
        });

        // 👥 Handle new user ready (host connects)
        socket.current.on("user-joined", async ({ userId }) => {
          peerConnection.current = new RTCPeerConnection(config);

          userStream.current.getTracks().forEach((track) => {
            peerConnection.current.addTrack(track, userStream.current);
          });

          peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
              socket.current.emit("ice-candidate", {
                meetingId: roomId,
                candidate: event.candidate,
              });
            }
          };

          peerConnection.current.ontrack = (event) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          };

          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);

          socket.current.emit("offer", {
            meetingId: roomId,
            offer,
          });
        });

        socket.current.on("offer", async ({ offer }) => {
          peerConnection.current = new RTCPeerConnection(config);

          userStream.current.getTracks().forEach((track) => {
            peerConnection.current.addTrack(track, userStream.current);
          });

          peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
              socket.current.emit("ice-candidate", {
                meetingId: roomId,
                candidate: event.candidate,
              });
            }
          };

          peerConnection.current.ontrack = (event) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          };

          await peerConnection.current.setRemoteDescription(offer);
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);

          socket.current.emit("answer", {
            meetingId: roomId,
            answer,
          });
        });

        socket.current.on("answer", async ({ answer }) => {
          await peerConnection.current.setRemoteDescription(answer);
        });

        socket.current.on("ice-candidate", async ({ candidate }) => {
          try {
            await peerConnection.current.addIceCandidate(candidate);
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        });
        // 🔇 Listen for forced mute
socket.current.on("force-mute", () => {
  if (remoteVideoRef.current) {
    remoteVideoRef.current.muted = true;
    console.log("🔇 You were muted by the host");
  }
});

// ❌ Listen for forced kick
socket.current.on("force-kick", () => {
  alert("❌ You were kicked by the host.");
  window.location.href = "/";
});

      } catch (error) {
        console.error("❌ Error starting call:", error);
      }
    };



    startCall();

    return () => {
      if (socket.current) socket.current.disconnect();
      if (peerConnection.current) peerConnection.current.close();
    };
  }, [roomId]);

  // ✅ Host approves or denies user
  const approveUser = (userId) => {
    socket.current.emit("approve-user", { meetingId: roomId, userId });
    setPendingUsers((prev) => prev.filter(id => id !== userId));
  };

  const denyUser = (userId) => {
    socket.current.emit("deny-user", { meetingId: roomId, userId });
    setPendingUsers((prev) => prev.filter(id => id !== userId));
  };

  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    socket.current.emit("chat-message", {
      meetingId: roomId,
      userId: "You",
      message: newMessage,
    });

    setMessages((prev) => [...prev, { userId: "You", message: newMessage }]);
    setNewMessage("");
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = peerConnection.current
        .getSenders()
        .find((s) => s.track.kind === "video");

      if (sender) {
        sender.replaceTrack(screenTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          sender.replaceTrack(userStream.current.getVideoTracks()[0]);
          localVideoRef.current.srcObject = userStream.current;
        };
      }
    } catch (error) {
      console.error("❌ Screen sharing failed:", error);
    }
  };
  const muteRemote = () => {
    socket.current.emit("mute-user", { meetingId: roomId });
  };
  
  const kickRemote = () => {
    socket.current.emit("kick-user", { meetingId: roomId });
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center p-6">
      <h1 className="text-4xl font-extrabold mb-6">Meeting Room: {roomId}</h1>

      {/* 🎥 Video Grid */}
      <div className="flex space-x-6">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-1/3 rounded-lg border-2 border-white" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-1/3 rounded-lg border-2 border-white bg-black" />
      </div>
      {isHost.current && (
  <div className="mt-4 flex space-x-3">
    <button
      onClick={muteRemote}
      className="bg-purple-600 px-4 py-2 rounded text-white"
    >
      🔇 Mute
    </button>
    <button
      onClick={kickRemote}
      className="bg-red-600 px-4 py-2 rounded text-white"
    >
      ❌ Kick
    </button>
  </div>
)}

      {!isJoined && (
        <p className="mt-4 text-red-400">Waiting for permission to access camera & mic...</p>
      )}

      {/* 🖥️ Share Screen */}
      <button
        onClick={startScreenShare}
        className="mt-6 bg-yellow-500 text-black px-6 py-2 rounded-md hover:bg-yellow-600"
      >
        🖥️ Share Screen
      </button>

      {/* 🚪 Host Controls */}
      {isHost.current && pendingUsers.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Join Requests</h2>
          {pendingUsers.map((userId, i) => (
            <div key={i} className="flex justify-center space-x-4 mt-2">
              <span className="text-sm">User ID: {userId}</span>
              <button onClick={() => approveUser(userId)} className="bg-green-600 px-3 py-1 rounded">Approve</button>
              <button onClick={() => denyUser(userId)} className="bg-red-600 px-3 py-1 rounded">Deny</button>
            </div>
          ))}
        </div>
      )}

      {/* 💬 Chat Box */}
      <div className="mt-10 w-2/3 bg-white text-black rounded-lg p-4 max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold mb-2">💬 Chat</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className="bg-gray-100 p-2 rounded-md shadow-sm">
              <strong>{msg.userId}:</strong> {msg.message}
            </div>
          ))}
        </div>
        <div className="flex mt-4 space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 rounded-md border border-gray-300"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;