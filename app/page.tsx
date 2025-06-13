"use client";

import { useState, useRef } from "react";
import ResizablePanel from "./components/ResizablePanel";
import TextSelectionPopup from "./components/TextSelectionPopup";
import ChatPanel, { ChatMessage } from "./components/ChatPanel";

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [apiKey, setApiKey] = useState<string>("");

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // click handler using event delegation
  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if there's an active text selection - if so, don't handle click
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      console.log('Click ignored due to active selection');
      return;
    }

    const target = e.target as HTMLElement;
    // Ensure clicked element is a span inside pdf text layer
    if (target.tagName === 'SPAN' && target.closest('.react-pdf__Page__textContent')) {
      const rect = target.getBoundingClientRect();
      
      console.log('Click debug:', {
        text: (target.textContent || '').substring(0, 50),
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        mousePos: { x: e.clientX, y: e.clientY },
        finalPos: { x: rect.left + rect.width / 2, y: rect.top }
      });
      
      setPopupState({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top,
        text: target.textContent || ''
      });
    } else {
      // Otherwise, clicked elsewhere -> close popup
      if (popupState.visible) setPopupState((prev) => ({ ...prev, visible: false }));
    }
  };

  const closePopup = () => setPopupState(prev=>({...prev, visible:false}));

  // Show popup when user finishes a text selection
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const selectedText = sel.toString().trim();
    if (!selectedText) return;

    // Only show popup if selection is within PDF container
    if (
      pdfContainerRef.current &&
      sel.anchorNode &&
      pdfContainerRef.current.contains(sel.anchorNode)
    ) {
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        console.log('Selection mouseup debug:', {
          selectedText: selectedText.substring(0, 50),
          rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          mousePos: { x: e.clientX, y: e.clientY },
          finalPos: { x: rect.left + rect.width / 2, y: rect.top },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          scroll: { x: window.scrollX, y: window.scrollY }
        });
        
        setPopupState({
          visible: true,
          x: rect.left + rect.width / 2,
          y: rect.top,
          text: selectedText,
        });
      } catch (error) {
        console.log('Range failed, using mouse position:', { x: e.clientX, y: e.clientY, error });
        // Fallback to mouse position
        setPopupState({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          text: selectedText,
        });
      }
    }
  };

  const addAssistantReply = (content:string)=>{
    setChatMessages(prev=>[...prev,{role:"assistant", content}]);
  }

  const handleSend = async (text:string)=>{
    // Check if API key is provided
    if (!apiKey.trim()) {
      addAssistantReply('Please enter your OpenAI API key first.');
      return;
    }

    // push user message
    setChatMessages(prev=>[...prev,{role:"user", content:text}]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...chatMessages, { role: 'user', content: text }],
          apiKey: apiKey 
        }),
      });

      if (!res.ok || !res.body) {
        addAssistantReply('Error: Unable to get response');
        return;
      }

      // prepare streaming assistant entry
      let assistantIndex: number;
      setChatMessages(prev => {
        assistantIndex = prev.length;
        return [...prev, { role: 'assistant', content: '' }];
      });

      const reader = res.body
        .pipeThrough(new TextDecoderStream())
        .getReader();

      let respText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        respText += value;
        setChatMessages(prev => {
          const updated = [...prev];
          updated[assistantIndex].content = respText;
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      addAssistantReply('Error contacting server');
    }
  };

  const handlePopupAction = (type:"explain"|"summarize"|"rewrite", text:string)=>{
    const prompt = `${type.charAt(0).toUpperCase()+type.slice(1)}: ${text}`;
    handleSend(prompt);
    closePopup();
  }

  return (
    <main className="flex h-screen bg-gray-100 w-full">
      {/* Sidebar */}
      <div id="sidebar" className="w-1/6 bg-gray-200 p-3 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">ChatPDF Clone</h1>
        
        {/* OpenAI API Key Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="apiKey" className="text-sm font-medium text-gray-700">
            OpenAI API Key
          </label>
          <input
            id="apiKey"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {apiKey && (
            <p className="text-xs text-green-600">✓ API Key entered</p>
          )}
        </div>

        {/* PDF Upload */}
        <div className="flex flex-col gap-2">
          <label htmlFor="pdfUpload" className="text-sm font-medium text-gray-700">
            Upload PDF
          </label>
          <input
            id="pdfUpload"
            type="file"
            accept="application/pdf"
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
          />
        </div>
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
          onAction={handlePopupAction}
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
        <ChatPanel messages={chatMessages} onSend={handleSend} />
      </ResizablePanel>
    </main>
  );
}