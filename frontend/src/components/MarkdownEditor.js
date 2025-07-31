// File: /home/com2u/src/OrganAIzer/frontend/src/components/MarkdownEditor.js
// Purpose: Rich markdown editor with preview mode and toolbar

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { hasuraService } from '../services/hasuraService';
import {
  EyeIcon,
  DocumentTextIcon,
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  ListBulletIcon,
  NumberedListIcon,
  CodeBracketIcon,
  PhotoIcon,
  TableCellsIcon,
  ChatBubbleLeftIcon,
  Bars3BottomLeftIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

const MarkdownEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Enter content in Markdown format...', 
  height = '400px',
  showToolbar = true,
  allowFileUpload = false,
  onFileUpload
}) => {
  const [mode, setMode] = useState('edit'); // 'edit', 'preview', 'split'
  const [selectedText, setSelectedText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const dropZoneRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = height;
    }
  }, [height]);

  const insertText = (before, after = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = value.substring(0, start) + 
                   before + textToInsert + after + 
                   value.substring(end);
    
    onChange(newText);
    
    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const insertAtCursor = (text) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = value.substring(0, start) + text + value.substring(end);
    onChange(newText);
    
    setTimeout(() => {
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const handleKeyDown = (e) => {
    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor('  ');
    }
    
    // Ctrl+B for bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      insertText('**', '**', 'bold text');
    }
    
    // Ctrl+I for italic
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      insertText('*', '*', 'italic text');
    }
    
    // Ctrl+K for link
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      insertText('[', '](url)', 'link text');
    }
  };

  const toolbarButtons = [
    {
      icon: BoldIcon,
      title: 'Bold (Ctrl+B)',
      action: () => insertText('**', '**', 'bold text')
    },
    {
      icon: ItalicIcon,
      title: 'Italic (Ctrl+I)',
      action: () => insertText('*', '*', 'italic text')
    },
    {
      icon: LinkIcon,
      title: 'Link (Ctrl+K)',
      action: () => insertText('[', '](url)', 'link text')
    },
    {
      icon: CodeBracketIcon,
      title: 'Code',
      action: () => insertText('`', '`', 'code')
    },
    {
      icon: ChatBubbleLeftIcon,
      title: 'Quote',
      action: () => insertText('> ', '', 'quote')
    },
    {
      icon: ListBulletIcon,
      title: 'Bullet List',
      action: () => insertText('- ', '', 'list item')
    },
    {
      icon: NumberedListIcon,
      title: 'Numbered List',
      action: () => insertText('1. ', '', 'list item')
    },
    {
      icon: Bars3BottomLeftIcon,
      title: 'Heading',
      action: () => insertText('## ', '', 'heading')
    },
    {
      icon: TableCellsIcon,
      title: 'Table',
      action: () => insertText('\n| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n', '', '')
    }
  ];

  const uploadFile = async (file) => {
    if (!allowFileUpload) return;

    try {
      setUploading(true);
      
      // Use custom onFileUpload if provided, otherwise use hasuraService
      let result;
      if (onFileUpload) {
        result = await onFileUpload(file);
        const fileUrl = typeof result === 'string' ? result : result.url;
        
        if (file.type.startsWith('image/')) {
          insertText(`![${file.name}](${fileUrl})`, '', '');
        } else {
          insertText(`[${file.name}](${fileUrl})`, '', '');
        }
      } else {
        result = await hasuraService.uploadFile(file);
        const fileUrl = result.file.url;
        
        if (file.type.startsWith('image/')) {
          insertText(`![${file.name}](${fileUrl})`, '', '');
        } else {
          insertText(`[${file.name}](${fileUrl})`, '', '');
        }
      }
    } catch (error) {
      console.error('File upload failed:', error);
      // You might want to show a toast notification here
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadFile(file);
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (allowFileUpload) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're leaving the drop zone entirely
    if (!dropZoneRef.current?.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!allowFileUpload) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Upload all image files
    for (const file of imageFiles) {
      await uploadFile(file);
    }
  };

  // Add drag and drop event listeners
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone || !allowFileUpload) return;

    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);

    return () => {
      dropZone.removeEventListener('dragenter', handleDragEnter);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }, [allowFileUpload]);

  return (
    <div className="border-2 border-black rounded-lg overflow-hidden">
      {/* Header with mode toggle and toolbar */}
      <div className="bg-gray-100 border-b-2 border-black p-3">
        <div className="flex items-center justify-between">
          {/* Mode Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                mode === 'edit' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <DocumentTextIcon className="h-4 w-4 inline-block mr-1" />
              Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                mode === 'preview' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <EyeIcon className="h-4 w-4 inline-block mr-1" />
              Preview
            </button>
            <button
              onClick={() => setMode('split')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                mode === 'split' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Split
            </button>
          </div>

          {/* File Upload */}
          {allowFileUpload && (
            <div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <label
                htmlFor="file-upload"
                className="px-3 py-1 bg-white text-gray-700 rounded text-sm font-medium hover:bg-gray-50 cursor-pointer inline-flex items-center"
              >
                <PhotoIcon className="h-4 w-4 mr-1" />
                Upload
              </label>
            </div>
          )}
        </div>

        {/* Toolbar */}
        {showToolbar && (mode === 'edit' || mode === 'split') && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-300">
            {toolbarButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                className="p-2 bg-white text-gray-700 rounded hover:bg-gray-50 transition-colors"
                title={button.title}
              >
                <button.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="relative" ref={dropZoneRef}>
        {/* Drag & Drop Overlay */}
        {isDragOver && allowFileUpload && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-4 border-dashed border-blue-500 flex items-center justify-center z-10">
            <div className="text-center">
              <CloudArrowUpIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-blue-700">Drop images here to upload</p>
              <p className="text-sm text-blue-600">Supports JPG, PNG, GIF, and other image formats</p>
            </div>
          </div>
        )}

        {/* Upload Progress Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 text-center">
              <CloudArrowUpIcon className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
              <p className="text-lg font-semibold text-gray-700">Uploading...</p>
              <p className="text-sm text-gray-500">Please wait while your file is being uploaded</p>
            </div>
          </div>
        )}
        {mode === 'edit' && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full p-4 font-mono text-sm border-none outline-none resize-none"
            style={{ height, minHeight: '200px' }}
          />
        )}

        {mode === 'preview' && (
          <div 
            className="p-4 overflow-y-auto prose max-w-none"
            style={{ height, minHeight: '200px' }}
          >
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom components for better styling
                h1: ({children}) => <h1 className="text-2xl font-bold mb-4 text-black">{children}</h1>,
                h2: ({children}) => <h2 className="text-xl font-bold mb-3 text-black">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-bold mb-2 text-black">{children}</h3>,
                p: ({children}) => <p className="mb-3 text-gray-800">{children}</p>,
                ul: ({children}) => <ul className="list-disc list-inside mb-3 text-gray-800">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside mb-3 text-gray-800">{children}</ol>,
                li: ({children}) => <li className="mb-1">{children}</li>,
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">
                    {children}
                  </blockquote>
                ),
                code: ({inline, children}) => 
                  inline ? (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-gray-100 p-3 rounded overflow-x-auto mb-3">
                      <code className="text-sm font-mono">{children}</code>
                    </pre>
                  ),
                table: ({children}) => (
                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full border-2 border-black">
                      {children}
                    </table>
                  </div>
                ),
                th: ({children}) => (
                  <th className="border border-black px-3 py-2 bg-gray-100 font-bold text-left">
                    {children}
                  </th>
                ),
                td: ({children}) => (
                  <td className="border border-black px-3 py-2">
                    {children}
                  </td>
                ),
                a: ({href, children}) => (
                  <a 
                    href={href} 
                    className="text-blue-600 hover:text-blue-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                img: ({src, alt}) => (
                  <img 
                    src={src} 
                    alt={alt} 
                    className="max-w-full h-auto rounded border-2 border-black mb-3"
                  />
                )
              }}
            >
              {value || '*No content to preview*'}
            </ReactMarkdown>
          </div>
        )}

        {mode === 'split' && (
          <div className="flex" style={{ height }}>
            <div className="w-1/2 border-r border-gray-300">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full h-full p-4 font-mono text-sm border-none outline-none resize-none"
              />
            </div>
            <div className="w-1/2 p-4 overflow-y-auto prose max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 className="text-xl font-bold mb-3 text-black">{children}</h1>,
                  h2: ({children}) => <h2 className="text-lg font-bold mb-2 text-black">{children}</h2>,
                  h3: ({children}) => <h3 className="text-base font-bold mb-2 text-black">{children}</h3>,
                  p: ({children}) => <p className="mb-2 text-sm text-gray-800">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-2 text-sm text-gray-800">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside mb-2 text-sm text-gray-800">{children}</ol>,
                  li: ({children}) => <li className="mb-1 text-sm">{children}</li>,
                  blockquote: ({children}) => (
                    <blockquote className="border-l-2 border-gray-300 pl-2 italic text-gray-600 mb-2 text-sm">
                      {children}
                    </blockquote>
                  ),
                  code: ({inline, children}) => 
                    inline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-gray-100 p-2 rounded overflow-x-auto mb-2">
                        <code className="text-xs font-mono">{children}</code>
                      </pre>
                    ),
                  table: ({children}) => (
                    <div className="overflow-x-auto mb-2">
                      <table className="min-w-full border border-black text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({children}) => (
                    <th className="border border-black px-2 py-1 bg-gray-100 font-bold text-left text-xs">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="border border-black px-2 py-1 text-xs">
                      {children}
                    </td>
                  ),
                  a: ({href, children}) => (
                    <a 
                      href={href} 
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  img: ({src, alt}) => (
                    <img 
                      src={src} 
                      alt={alt} 
                      className="max-w-full h-auto rounded border border-black mb-2"
                    />
                  )
                }}
              >
                {value || '*No content to preview*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Footer with help text */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>
            Supports Markdown syntax. Use **bold**, *italic*, [links](url), `code`, and more.
          </span>
          <span>
            {value.length} characters
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
