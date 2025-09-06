import { useState, useRef, useEffect } from "react";

export default function BubbleInput({ }) {
  
  const [text, setText] = useState("");
  const [height, setHeight] = useState(0);
  const textareaRef = useRef(null);
  return(
         <div
          className="bg-white rounded-2xl px-4 py-3 shadow-md max-w-xs w-auto flex flex-col transition-all duration-200"
          style={{ minHeight: "60px", height: `${height + 20}px` }}
        > 
          <textarea
            ref={textareaRef}
            placeholder="คิดอะไรอยู่..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full text-gray-600 text-sm border-none resize-none focus:outline-none bg-transparent placeholder-gray-400 overflow-hidden"
            rows={1}
          />
        </div>
  );
}
