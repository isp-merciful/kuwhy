let notes = [
  { id: 5, message: "อะไรน้ออออออออออออออออออออออ", image: "/images/pfp.png", username: "moohagaga", current_time: new Date().toISOString() },
  { id: 2, message: "ฝนตกอย่างลั่น🥶", image: "/images/pfp.png", username: "bigsang", current_time: new Date().toISOString() },
  { id: 3, message: "อยากกินหมูกระทะ", image: "/images/pfp.png", username: "manputan", current_time: new Date().toISOString() },
  { id: 4, message: "ทำไมงานมันไม่เคยเสร็จสักที", image: "/images/pfp.png", username: "alice123", current_time: new Date().toISOString() },
  { id: 1, message: "ผู้คนตายเมื่อถูกฆ่า", image: "/images/pfp.png", username: "john_doe", current_time: new Date().toISOString() },    
  { id: 6, message: "ทำไมต้องมีเรื่องให้เครียดทุกวัน", image: "/images/pfp.png", username: "jerry_king", current_time: new Date().toISOString() },
];

export async function GET(request) {
  return Response.json(notes);
}

export async function POST(request) {
  try {
    const body = await request.json(); // รับ JSON จาก frontend
    const { message, username, image } = body;

    if (!message || !username) {
      return new Response(JSON.stringify({ error: "ข้อความหรือชื่อผู้ใช้หายไป" }), { status: 400 });
    }

    const newNote = {
      id: Date.now(), // ใช้ timestamp เป็น id ชั่วคราว
      message,
      image: image || "/images/pfp.png", // กำหนด default ถ้าไม่ส่ง
      username,
      current_time: new Date().toISOString(), 
    };

    notes.push(newNote); 
    return new Response(JSON.stringify(newNote), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "เกิดข้อผิดพลาด" }), { status: 500 });
  }
}