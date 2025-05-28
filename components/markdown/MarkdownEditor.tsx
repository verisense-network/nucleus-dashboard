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
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  imagePlugin,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  linkPlugin,
  codeBlockPlugin,
  InsertCodeBlock,
  codeMirrorPlugin,
  linkDialogPlugin,
  tablePlugin,
  InsertTable,
} from "@mdxeditor/editor";
import { ForwardedRef } from "react";
import { twMerge } from "tailwind-merge";
import AddImage from "./AddImage";
import AddMention from "./AddMention";
import { basicDark } from "cm6-theme-basic-dark";

interface EditorProps extends MDXEditorProps {
  editorRef?: ForwardedRef<MDXEditorMethods> | null;
}

export default function MarkdownEditor({ editorRef, ...props }: EditorProps) {
  return (
    <MDXEditor
      plugins={[
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BlockTypeSelect />
              <BoldItalicUnderlineToggles />
              <ListsToggle />
              <InsertTable />
              <AddImage />
              <CreateLink />
              <InsertCodeBlock />
              <AddMention />
            </>
          ),
        }),
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
      placeholder="Write something..."
      className={twMerge(
        `w-full overflow-hidden max-w-none dark-theme dark-editor`,
        props.className
      )}
      contentEditableClassName={twMerge(
        `prose dark:prose-invert md:prose-img:max-w-2xl md:prose-img:max-h-[60vh] w-full max-w-full overflow-auto`,
        props.contentEditableClassName
      )}
    />
  );
}
