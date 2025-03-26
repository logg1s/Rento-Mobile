export type ChatBotResponseSql = {
  type: "sql";
  sql: string;
  message: string;
};

export type ChatBotResponseData = {
  type: "text";
  message: string;
  data: any[];
  dataType: "order" | "service" | "category";
};

export type ChatBotResponseType = ChatBotResponseSql | ChatBotResponseData;
