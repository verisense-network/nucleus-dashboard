"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@heroui/react";
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  title: string;
}

export default function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-default-700">{title}</h4>
        <Button
          size="sm"
          variant="flat"
          color={copied ? "success" : "default"}
          startContent={copied ? <Check size={16} /> : <Copy size={16} />}
          onPress={handleCopy}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="bg-default-100 rounded-lg overflow-auto text-xs p-4">
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
} 