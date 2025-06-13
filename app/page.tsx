"use client";

import { useState, useRef } from "react";
import ResizablePanel from "./components/ResizablePanel";
import TextSelectionPopup from "./components/TextSelectionPopup";

// React-PDF components (Webpack entry ensures worker is bundled correctly)
import { Document, Page, pdfjs } from "react-pdf";

// Import default styles for text & annotation layers
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// Ensure the worker version matches the pdf.js version bundled with react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

export default function Home() {
  // PDF state handling
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [popupState, setPopupState] = useState<{visible:boolean, x:number, y:number, text:string}>({visible:false, x:0, y:0, text:""});
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // click handler using event delegation
  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Ensure clicked element is a span inside pdf text layer
    if (target.tagName === 'SPAN' && target.closest('.react-pdf__Page__textContent')) {
      const rect = target.getBoundingClientRect();
      setPopupState({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top,
        text: target.textContent || ''
      });
    } else {
      // If a text selection is still active, keep the popup open so that mouseup handler can decide
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        return;
      }
      // Otherwise, clicked elsewhere -> close popup
      if (popupState.visible) setPopupState((prev) => ({ ...prev, visible: false }));
    }
  };

  const closePopup = () => setPopupState(prev=>({...prev, visible:false}));

  // Show popup when user finishes a text selection (mouse up)
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const selectedText = sel.toString().trim();
    if (!selectedText) return;

    if (pdfContainerRef.current && sel.anchorNode && pdfContainerRef.current.contains(sel.anchorNode)) {
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPopupState({
          visible: true,
          x: rect.left + rect.width / 2,
          y: rect.top,
          text: selectedText,
        });
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <main className="flex h-screen bg-gray-100 w-full">
      {/* Sidebar */}
      <div id="sidebar" className="w-1/6 bg-gray-200 p-3 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">ChatPDF Clone</h1>
        <input
          type="file"
          accept="application/pdf"
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
        />
      </div>

      {/* PDF Display Area */}
      <div id="pdf-display" className="flex-1 bg-gray-300 overflow-y-auto h-full flex justify-center" onClick={handlePdfClick} onMouseUp={handleMouseUp} ref={pdfContainerRef}>
        {!pdfFile && (
          <div className="flex flex-col items-center justify-center h-full text-gray-700">
            <p className="mb-4">Select a PDF to start reading</p>
          </div>
        )}

        {pdfFile && (
          <div className="py-4">
            <Document
              file={pdfFile}
              onLoadSuccess={handleDocumentLoadSuccess}
              className="flex flex-col items-center gap-4"
            >
              {Array.from({ length: numPages }, (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={600}
                  renderAnnotationLayer={false}
                  renderTextLayer={true}
                />
              ))}
            </Document>
          </div>
        )}

        {/* Popup */}
        <TextSelectionPopup
          visible={popupState.visible}
          x={popupState.x}
          y={popupState.y}
          onClose={closePopup}
          selectedText={popupState.text}
        />
      </div>

      {/* Chat Panel */}
      <ResizablePanel
        className="bg-gray-200"
        initialWidth={33.33}
        minWidth={20}
        maxWidth={60}
        position="right"
      >
        <div className="p-4 h-full flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Chat</h3>
          {/* Chat content will go here */}
        </div>
      </ResizablePanel>
    </main>
  );
}