import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const QuillEditor = forwardRef(({ value, onChange, placeholder }, ref) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!editorRef.current) {
      // Initialize Quill once
      editorRef.current = new Quill(containerRef.current, {
        theme: "snow",
        placeholder: placeholder || "",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
          ],
        },
      });

      // Handle text changes
      editorRef.current.on("text-change", () => {
        onChange(editorRef.current.root.innerHTML);
      });
    }

    // Set initial content
    editorRef.current.root.innerHTML = value || "";

  }, []); // Run once

  // Update content if value changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.root.innerHTML !== value) {
      editorRef.current.root.innerHTML = value || "";
    }
  }, [value]);

  // Expose Quill instance to parent via ref
  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current,
    getContents: () => editorRef.current.getContents(),
    getText: () => editorRef.current.getText(),
    setContents: (delta) => editorRef.current.setContents(delta),
    insertHTML: (html) => {
      const range = editorRef.current.getSelection(true);
      editorRef.current.clipboard.dangerouslyPasteHTML(range.index, html);
    },
  }));

  // Add fixed height to prevent duplicate empty div
  return <div ref={containerRef} style={{ height: "250px" }} />;
});

export default QuillEditor;
