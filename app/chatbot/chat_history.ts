export const chatHistory = [
  {
    role: "user",
    parts: [{ text: "Xin chào\n" }],
  },
  {
    role: "model",
    parts: [
      {
        text: '```json\n{\n  "type": "text",\n  "message": "Chào bạn 👋! Rento rất vui được hỗ trợ bạn tìm kiếm dịch vụ tại nhà. Bạn cần tìm gì ạ? 🏡",\n  "data": [],\n  "dataType": null\n}\n```\n',
      },
    ],
  },
  {
    role: "user",
    parts: [{ text: "Cho tôi thông tin 1 vài dịch vụ về Sửa chữa đi\n" }],
  },
  {
    role: "model",
    parts: [
      {
        text: '```json\n{\n  "type": "sql",\n  "sql": "SELECT * FROM services WHERE category_id IN (SELECT id FROM categories WHERE category_name LIKE \'%Sửa chữa%\') LIMIT 50;",\n  "message": "🛠️ Ok bạn ơi, đây là một vài dịch vụ liên quan đến \'Sửa chữa\' mà mình tìm được. Bạn xem thử có ưng ý cái nào không nha! 😉"\n}\n```\n',
      },
    ],
  },
];
