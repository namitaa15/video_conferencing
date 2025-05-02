import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/auth";


const MeetingRoom = () => {
  const { user } = useAuth();
  const [userAvatars, setUserAvatars] = useState({});
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const chatBottomRef = useRef(null);
  const socket = useRef(null);
  const peerConnections = useRef({});
  const userStream = useRef(null);
  const isHost = useRef(false); // 👑 Host flag
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pendingUsers, setPendingUsers] = useState([]); // 🚪 Join requests
  const [remoteStreams, setRemoteStreams] = useState({});
  const [userNames, setUserNames] = useState({});

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
        // use env vars for url
        socket.current = io(import.meta.env.VITE_BACKEND_URL, { transports: ["websocket"] });

        socket.current.on("connect", () => {
          console.log("✅ Connected to socket:", socket.current.id);

          // 👑 First user becomes host
          if (Object.keys(peerConnections.current).length === 0) {
            isHost.current = true;
            console.log("👑 You are the host");
          }


          // Host: no emit on connect, waits for approval
          // Others: send join request
          socket.current.emit("join-meeting", {
            meetingId: roomId,
            userId: socket.current.id,
            name: user.name, // 👈 Add this line
            avatar: user.avatar, // 🆕
          });

        });

        // 💬 Chat
        socket.current.on("chat-message", ({ userId, name, avatar, message, time }) => {
          setMessages((prev) => [...prev, { userId, name, avatar, message, time }]);
          chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });

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
        socket.current.on("user-joined", async ({ userId, name, avatar }) => {
          setUserNames(prev => ({ ...prev, [userId]: name }));
          setUserAvatars(prev => ({ ...prev, [userId]: avatar })); // 🆕
          const pc = new RTCPeerConnection(config);
          peerConnections.current[userId] = pc;

          userStream.current.getTracks().forEach((track) => {
            pc.addTrack(track, userStream.current);
          });

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socket.current.emit("ice-candidate", {
                meetingId: roomId,
                candidate: event.candidate,
                to: userId,
              });
            }
          };

          pc.ontrack = (event) => {
            console.log("🎥 Track received from", userId || to);
            setRemoteStreams((prev) => ({
              ...prev,
              [userId]: event.streams[0],
            }));
          };

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.current.emit("offer", {
            meetingId: roomId,
            offer,
            to: userId,
          });
        });


        socket.current.on("offer", async ({ offer, to }) => {
          const pc = new RTCPeerConnection(config);
          peerConnections.current[to] = pc;

          userStream.current.getTracks().forEach((track) => {
            pc.addTrack(track, userStream.current);
          });

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socket.current.emit("ice-candidate", {
                meetingId: roomId,
                candidate: event.candidate,
                to,
              });
            }
          };

          pc.ontrack = (event) => {
            console.log("🎥 Track received from", userId || to);
            setRemoteStreams((prev) => ({
              ...prev,
              [to]: event.streams[0],
            }));
          };

          await pc.setRemoteDescription(offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.current.emit("answer", {
            meetingId: roomId,
            answer,
            to,
          });
        });


        socket.current.on("answer", async ({ answer, to }) => {
          const pc = peerConnections.current[to];
          if (pc) await pc.setRemoteDescription(answer);
        });


        socket.current.on("ice-candidate", async ({ candidate, to }) => {
          const pc = peerConnections.current[to];
          if (pc && candidate) {
            await pc.addIceCandidate(candidate);
          }
        });
        // 🚫 Remove peer and UI when a user is disconnected or kicked
socket.current.on("user-disconnected", ({ userId }) => {
  // 1. Close peer connection
  if (peerConnections.current[userId]) {
    peerConnections.current[userId].close();
    delete peerConnections.current[userId];
  }

  // 2. Remove from video UI
  setRemoteStreams((prev) => {
    const updated = { ...prev };
    delete updated[userId];
    return updated;
  });

  setUserAvatars((prev) => {
    const updated = { ...prev };
    delete updated[userId];
    return updated;
  });

  setUserNames((prev) => {
    const updated = { ...prev };
    delete updated[userId];
    return updated;
  });
});


        // 🔇 Listen for forced mute
        socket.current.on("force-mute", () => {
          // if (remoteVideoRef.current) {
          //   remoteVideoRef.current.muted = true;
          // }
          console.log("🔇 You were muted by the host");
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
      for (const [userId, pc] of Object.entries(peerConnections.current)) {
        pc.close();
        delete peerConnections.current[userId];
      }
      setRemoteStreams({});

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
      name: user.name,
      avatar: user.avatar,
      message: newMessage,
    });


  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });

      screenTrack.onended = () => {
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track.kind === "video");
          if (sender) sender.replaceTrack(userStream.current.getVideoTracks()[0]);
        });
        localVideoRef.current.srcObject = userStream.current;
      };

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
    } catch (error) {
      console.error("❌ Screen sharing failed:", error);
    }
  };

  // const muteRemote = () => {
  //   socket.current.emit("mute-user", { meetingId: roomId });
  // };
  const toggleMute = () => {
    if (!userStream.current) return;

    const audioTrack = userStream.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };
  const toggleCamera = () => {
    if (!userStream.current) return;

    const videoTrack = userStream.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center p-6">
      <h1 className="text-4xl font-extrabold mb-6">Meeting Room: {roomId}</h1>

      {/* 🎥 Video Grid */}
      {/* 🎥 Video Grid with Names & Responsive Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full justify-items-center">
        {/* Local video */}
        <div className="flex flex-col items-center">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-96 h-72 rounded-xl border-2 border-white shadow-lg" />
          <div className="flex items-center gap-2 mt-1 text-sm">
            <img
              src={user.avatar || "/default-avatar.png"}
              alt="You"
              className="w-6 h-6 rounded-full"
            />
            <span>{user.name || "You"}</span>
          </div>

        </div>

        {/* Remote videos */}
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <div key={userId} className="flex flex-col items-center bg-gray-800 p-2 rounded-lg">
            <video
              autoPlay
              playsInline
              className="w-[600px] h-[500px] object-cover rounded-2xl border-4 border-white shadow-xl"
              ref={(video) => {
                if (video) video.srcObject = stream;
              }}
            />


            <div className="flex items-center gap-2 mt-1 text-sm">
              <img
                src={userAvatars[userId] || "/default-avatar.png"}
                alt="avatar"
                className="w-6 h-6 rounded-full"
              />
              <span>{userNames[userId] || "Participant"}</span>
            </div>


            {/* 🎯 Host Controls: Per User */}
            {isHost.current && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => socket.current.emit("mute-user", { meetingId: roomId, targetId: userId })}
                  className="bg-purple-600 px-2 py-1 rounded text-xs"
                >
                  🔇 Mute
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to kick this user?")) {
                      socket.current.emit("kick-user", { meetingId: roomId, targetId: userId });
                    }
                  }}
                  className="bg-red-600 px-2 py-1 rounded text-xs"
                >
                  ❌ Kick
                </button>
              </div>
            )}
          </div>
        ))}

      </div>
      <button
        onClick={toggleMute}
        className={`mt-4 px-4 py-2 rounded ${isMuted ? "bg-red-600" : "bg-green-600"}`}
      >
        {isMuted ? "🎙️ Unmute Mic" : "🔇 Mute Mic"}
      </button>
      <button
        onClick={toggleCamera}
        className={`mt-2 px-4 py-2 rounded ${isCameraOff ? "bg-red-600" : "bg-green-600"}`}
      >
        {isCameraOff ? "📷 Turn On Camera" : "📴 Turn Off Camera"}      </button>

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
            <div key={index} className="bg-gray-100 p-2 rounded-md shadow-sm flex items-start gap-2">
              <div>
                <div className="font-semibold text-sm">{msg.name}</div>
                <div className="text-xs text-gray-500">{msg.time}</div>
                <div>{msg.message}</div>
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />

        </div>
        <div className="flex mt-4 space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
                setNewMessage("");
              }
            }}
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
