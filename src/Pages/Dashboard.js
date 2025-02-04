import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import "bootstrap/dist/css/bootstrap.min.css";
import { auth } from "../firebase/firebaseConfig";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const Dashboard = () => {
  const [applicants, setApplicants] = useState([]);
  const [currentApplicantIndex, setCurrentApplicantIndex] = useState(0); // Keep track of the current applicant's index
  const [documents, setDocuments] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-Out Error:", error);
    }
  };

  const handleAddApplicant = () => {
    const applicantName = prompt("Enter applicant name:");
    if (applicantName && applicantName.trim() !== "") {
      const newApplicant = {
        id: Date.now(), // simple way to generate a unique ID
        name: applicantName,
      };
      setApplicants((prev) => [...prev, newApplicant]);
      setCurrentApplicantIndex(applicants.length); // Set the new applicant as the current one
    } else {
      alert("Please provide a valid applicant name.");
    }
  };

  const handleDeleteApplicant = () => {
    const applicantToDelete = applicants[currentApplicantIndex];
    setApplicants((prev) => prev.filter((app) => app.id !== applicantToDelete.id));
    setCurrentApplicantIndex(0); // Reset to the first applicant after deletion
  };

  const handleAddDocument = () => {
    if (!applicants[currentApplicantIndex]) {
      alert("Please select an applicant first.");
      return;
    }
    const documentName = prompt("Enter document name:");
    if (documentName && documentName.trim() !== "") {
      const newDocument = { id: Date.now(), name: documentName, files: [] };
      const currentApplicant = applicants[currentApplicantIndex].id;
      setDocuments((prev) => ({
        ...prev,
        [currentApplicant]: [...(prev[currentApplicant] || []), newDocument],
      }));
    } else {
      alert("Please provide a valid document name.");
    }
  };

  const handleDeleteDocument = (docId) => {
    const currentApplicant = applicants[currentApplicantIndex].id;
    setDocuments((prev) => ({
      ...prev,
      [currentApplicant]: prev[currentApplicant].filter((doc) => doc.id !== docId),
    }));
  };

  const handleFileChange = (docId, files) => {
    const currentApplicant = applicants[currentApplicantIndex].id;
    const updatedDocuments = documents[currentApplicant].map((doc) =>
      doc.id === docId
        ? { ...doc, files: [...doc.files, ...files] }
        : doc
    );
    setDocuments((prev) => ({
      ...prev,
      [currentApplicant]: updatedDocuments,
    }));
  };

  const handleRemoveFile = (docId, fileIndex) => {
    const currentApplicant = applicants[currentApplicantIndex].id;
    const updatedDocuments = documents[currentApplicant].map((doc) =>
      doc.id === docId
        ? {
            ...doc,
            files: doc.files.filter((_, index) => index !== fileIndex),
          }
        : doc
    );
    setDocuments((prev) => ({
      ...prev,
      [currentApplicant]: updatedDocuments,
    }));
  };

  const handleNextApplicant = () => {
    if (currentApplicantIndex < applicants.length - 1) {
      setCurrentApplicantIndex(currentApplicantIndex + 1);
    }
  };

  const handlePrevApplicant = () => {
    if (currentApplicantIndex > 0) {
      setCurrentApplicantIndex(currentApplicantIndex - 1);
    }
  };

  if (!user) {
    return (
      <div className="container text-center mt-5">
        <h2>Login to Access Dashboard</h2>
        <button className="btn btn-primary" onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between">
        <h2>Document Upload</h2>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      {/* Add Applicant Section */}
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-primary" onClick={handleAddApplicant}>
          + Add Applicant
        </button>
      </div>

      {/* Applicant Profile Section */}
      {applicants.length > 0 && (
        <div className="mt-4 p-3 border rounded bg-light">
          <h4>Applicant: {applicants[currentApplicantIndex]?.name}</h4>
          <button className="btn btn-danger btn-sm mt-2" onClick={handleDeleteApplicant}>
            🗑 Delete Profile
          </button>
          <div className="mt-3">
            <button className="btn btn-success" onClick={handleAddDocument}>
              📄 + Add Document
            </button>
          </div>
        </div>
      )}

      {/* Documents Section */}
      {applicants.length > 0 && documents[applicants[currentApplicantIndex].id] && (
        <div>
          <h5>Documents for {applicants[currentApplicantIndex]?.name}</h5>
          {documents[applicants[currentApplicantIndex].id].map((doc) => (
            <div key={doc.id} className="mt-3 p-3 border rounded bg-white">
              <h6>{doc.name}</h6>
              <button className="btn btn-danger btn-sm mb-2" onClick={() => handleDeleteDocument(doc.id)}>
                X
              </button>
              <DropzoneComponent
                docId={doc.id}
                onDrop={(files) => handleFileChange(doc.id, files)}
              />
              {doc.files.length > 0 && (
                <div className="mt-3">
                  <h6>Uploaded Files:</h6>
                  {doc.files.map((file, index) => (
                    <div key={index} className="mt-2 d-flex align-items-center border p-2 rounded">
                      <span className="me-2">{file.name}</span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveFile(doc.id, index)}
                      >
                        🗑 Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Navigation Between Applicants */}
      {applicants.length > 1 && (
        <div className="d-flex justify-content-between mt-3">
          <button
            className="btn btn-secondary"
            onClick={handlePrevApplicant}
            disabled={currentApplicantIndex === 0}
          >
            next
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleNextApplicant}
            disabled={currentApplicantIndex === applicants.length - 1}
          >
            back
          </button>
        </div>
      )}
    </div>
  );
};

const DropzoneComponent = ({ docId, onDrop }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`p-4 text-center border rounded ${isDragActive ? "bg-secondary text-white" : "bg-light"}`}
      style={{ cursor: "pointer" }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>📂 Drop the files here...</p>
      ) : (
        <p>📥 Drag & Drop files here, or click to select files</p>
      )}
    </div>
  );
};

export default Dashboard;
