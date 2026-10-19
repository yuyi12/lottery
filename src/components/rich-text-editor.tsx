"use client";

import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Button, Divider, message } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  PictureOutlined,
  UndoOutlined,
  RedoOutlined,
} from "@ant-design/icons";

interface Props {
  initialContent?: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
}

export default function RichTextEditor({
  initialContent = "",
  onChange,
  readOnly = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExt,
      ...(readOnly
        ? []
        : [Placeholder.configure({ placeholder: "请输入内容…" })]),
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  if (!editor) return null;

  // 查看模式：不显示工具栏，只渲染内容
  if (readOnly) {
    return (
      <div className="border border-gray-200 rounded">
        <EditorContent editor={editor} className="p-3" />
      </div>
    );
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "note-images");
    try {
      const res = await fetch("/api/plc/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || "图片上传失败");
        return;
      }
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch {
      message.error("图片上传失败");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const activeCls = (on: boolean) => (on ? "!text-blue-500" : "");

  return (
    <div className="border border-gray-300 rounded">
      <div className="border-b border-gray-200 px-2 py-1 flex flex-wrap items-center gap-1">
        <Button
          size="small"
          type="text"
          icon={<BoldOutlined />}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={activeCls(editor.isActive("bold"))}
        />
        <Button
          size="small"
          type="text"
          icon={<ItalicOutlined />}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={activeCls(editor.isActive("italic"))}
        />
        <Button
          size="small"
          type="text"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={activeCls(editor.isActive("heading", { level: 2 }))}
        >
          H2
        </Button>
        <Button
          size="small"
          type="text"
          icon={<UnorderedListOutlined />}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={activeCls(editor.isActive("bulletList"))}
        />
        <Button
          size="small"
          type="text"
          icon={<OrderedListOutlined />}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={activeCls(editor.isActive("orderedList"))}
        />
        <Button
          size="small"
          type="text"
          icon={<PictureOutlined />}
          onClick={() => fileInputRef.current?.click()}
        />
        <Divider type="vertical" />
        <Button
          size="small"
          type="text"
          icon={<UndoOutlined />}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <Button
          size="small"
          type="text"
          icon={<RedoOutlined />}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <EditorContent editor={editor} className="p-3" />
    </div>
  );
}
