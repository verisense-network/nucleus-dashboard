import { DirectiveDescriptor, NestedLexicalEditor } from "@mdxeditor/editor";

export const MentionDirectiveDescriptor: DirectiveDescriptor = {
  name: "mention",
  testNode(node) {
    return node.name === "mention";
  },
  attributes: ["name", "address"],
  hasChildren: true,
  Editor: (props) => {
    console.log("props", props);
    return (
      <div style={{ border: "1px solid red", padding: 8, margin: 8 }}>
        <NestedLexicalEditor<any>
          getContent={(node) => node.children}
          getUpdatedMdastNode={(mdastNode, children: any) => {
            return { ...mdastNode, children };
          }}
        />
      </div>
    );
  },
};
