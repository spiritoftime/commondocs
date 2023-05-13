import { useEffect, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import { io } from "socket.io-client";
import { useAppContext } from "../context/appContext";
import DocumentBar from "../components/DocumentBar";
import NestedFolders from "../components/NestedFolders";
import { useNavigate } from "react-router-dom";
import ReactQuillBar, { formats, modules } from "../components/ReactQuillBar";
import useReLoginMutation from "../../reactQueryMutations/useReLoginMutation";
const SAVE_INTERVAL_MS = 1000;

export default function TextEditor() {
  const { authDetails, setAuthDetails, setIsLoadingAuth, isDarkMode } =
    useAppContext();
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [accessType, setAccessType] = useState("");
  const { id: documentId } = useParams();
  const [users, setUsers] = useState([]);
  const reloginMutation = useReLoginMutation();
  const [documentSaved, setDocumentSaved] = useState("All changes saved!");
  const navigate = useNavigate();
  const quillRef = useRef();
  const saveTimeout = useRef(null);
  const [socket, setSocket] = useState();

  const [residingFolder, setResidingFolder] = useState(null);

  const switchRoom = (newDocumentId, socket) => {
    if (socket && newDocumentId !== documentId) {
      // Emit a 'switch-room' event to the server with the old and new documentId
      socket.emit(
        "switch-document",
        documentId,
        newDocumentId,
        authDetails.username
      );
      navigate(`/documents/${newDocumentId}`);
    }
  };
  // mount the socket.io
  useEffect(() => {
    const s = io("http://localhost:3001"); // connect to backend URI

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(false);
    };
  }, []);
  useEffect(() => {
    if (socket == null || quillRef == null) return;
    const quillInstance = quillRef.current.getEditor();
    socket.emit("get-document", documentId, authDetails.username);
    quillInstance.setText("Loading...");
    quillInstance.disable();
    socket.emit("join-document", documentId);
    socket.once(
      "load-document",
      (document, title, residingFolder, accessType) => {
        setDocumentTitle(title);
        setResidingFolder(residingFolder);
        setIsLoadingAuth(true);
        reloginMutation();
        setAccessType(accessType);
        setIsLoadingAuth(false);
        quillInstance.setContents(document);
        if (accessType !== "viewer") quillInstance.enable();
      }
    );
  }, [documentId, quillRef, socket]);
  // all the socket logic
  useEffect(() => {
    if (socket == null || quillRef == null) return;
    const quillInstance = quillRef.current.getEditor();

    const sendChangehandler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta, documentId);
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      // Set new save timeout
      saveTimeout.current = setTimeout(() => {
        socket.emit("save-document", quillInstance.getContents(), documentId);

        setDocumentSaved("saving document....");
      }, SAVE_INTERVAL_MS);
    };
    socket.on("users", (users) => {
      setUsers(users);
    });
    const updateHandler = (delta, oldDelta, source) => {
      quillInstance.updateContents(delta);
    };
    socket.on("document-saved", (message) => {
      setDocumentSaved(message);
    });
    quillInstance.on("text-change", sendChangehandler);
    socket.on("receive-changes", updateHandler);
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      quillInstance.off("text-change", sendChangehandler);
    };
  }, [socket, quillRef]);

  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex">
        <Box
          display="flex"
          position="sticky"
          sx={{
            backgroundColor: isDarkMode
              ? "hsl(160, 0%, 20%)"
              : "hsl(160, 0%, 92%)",
            padding: "64px 16px",
            height: "100vh",
            top: 0,
            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.2)",
          }}
          flexDirection="column"
        >
          <NestedFolders
            accessType={"creator"}
            type="personal"
            socket={socket}
            switchRoom={switchRoom}
          />
          <NestedFolders
            type="shared"
            accessType={accessType}
            socket={socket}
            switchRoom={switchRoom}
          />
        </Box>
        <Box
          display="flex"
          sx={{ flexGrow: 1, padding: "0 16px" }}
          flexDirection="column"
        >
          <DocumentBar
            accessType={accessType}
            residingFolder={residingFolder}
            users={users}
            setDocumentSaved={setDocumentSaved}
            setDocumentTitle={setDocumentTitle}
            documentTitle={documentTitle}
            documentId={documentId}
            documentSaved={documentSaved}
          />
          <ReactQuillBar />
          <ReactQuill
            ref={quillRef}
            modules={modules}
            formats={formats}
            theme="snow"
          />
        </Box>
      </Box>
    </Box>
  );
}
