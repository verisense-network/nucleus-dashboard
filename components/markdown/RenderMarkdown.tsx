"use client";

import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  imagePlugin,
  linkPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  linkDialogPlugin,
  tablePlugin,
} from "@mdxeditor/editor";
import truncateMarkdown from "markdown-truncate";
import { ForwardedRef } from "react";
import { twMerge } from "tailwind-merge";
import { basicDark } from "cm6-theme-basic-dark";

interface RenderMarkdownProps extends MDXEditorProps {
  editorRef?: ForwardedRef<MDXEditorMethods> | null;
  truncate?: number;
}

export default function RenderMarkdown({
  editorRef,
  ...props
}: RenderMarkdownProps) {
  const truncateContent = props.truncate
    ? truncateMarkdown(props.markdown.trim(), {
        limit: props.truncate,
        ellipsis: true,
      })
    : props.markdown;

  return (
    <MDXEditor
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        imagePlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
        codeMirrorPlugin({
          codeMirrorExtensions: [basicDark],
          autoLoadLanguageSupport: true,
          codeBlockLanguages: {
            txt: "Text",
            rust: "Rust",
            ts: "TypeScript",
            js: "JavaScript",
            c: "C",
            cpp: "C++",
            css: "CSS",
            html: "HTML",
            mdx: "MDX",
          },
        }),
        tablePlugin(),
      ]}
      {...props}
      ref={editorRef}
      className={twMerge(
        `w-full overflow-hidden max-w-none dark-theme dark-editor dark-editor-readonly`,
        props.className
      )}
      contentEditableClassName={twMerge(
        `prose dark:prose-invert md:prose-img:max-w-2xl md:prose-img:max-h-[60vh] w-full max-w-full p-0!`,
        props.contentEditableClassName
      )}
      markdown={truncateContent}
      readOnly
    />
  );
}
