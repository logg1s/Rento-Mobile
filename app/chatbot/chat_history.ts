const dbTable = {
  ...require("@/lib/dbtable/benefit_price.json"),
  ...require("@/lib/dbtable/benefits.json"),
  ...require("@/lib/dbtable/categories.json"),
  ...require("@/lib/dbtable/comments.json"),
  ...require("@/lib/dbtable/favorite.json"),
  ...require("@/lib/dbtable/locations.json"),
  ...require("@/lib/dbtable/orders.json"),
  ...require("@/lib/dbtable/provinces.json"),
  ...require("@/lib/dbtable/prices.json"),
  ...require("@/lib/dbtable/services.json"),
};

export const chatHistory = [
  {
    role: "user",
    parts: [
      {
        text: "Yêu cầu luôn trả về JSON",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: '```json\n{\n  "type": "text",\n  "message": "Được, tôi sẽ trả về JSON nhé! 😊",\n  "data": [],\n  "dataType": null\n}\n```\n',
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: `### Đây là cấu trúc bảng của tôi trong MySQL, bạn cần tuân thủ hướng dẫn hệ thống và tuân theo cấu trúc này:
-- rento.cache definition

CREATE TABLE cache (
  key varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  value mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  expiration int NOT NULL,
  PRIMARY KEY (key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.cache_locks definition

CREATE TABLE cache_locks (
  key varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  owner varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  expiration int NOT NULL,
  PRIMARY KEY (key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.channel_notifications definition

CREATE TABLE channel_notifications (
  id varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  description varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.email_verifications definition

CREATE TABLE email_verifications (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  email varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  code varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  expires_at timestamp NOT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.failed_jobs definition

CREATE TABLE failed_jobs (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  uuid varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  connection text COLLATE utf8mb4_unicode_ci NOT NULL,
  queue text COLLATE utf8mb4_unicode_ci NOT NULL,
  payload longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  exception longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  failed_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY failed_jobs_uuid_unique (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.images definition

CREATE TABLE images (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  path varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.job_batches definition

CREATE TABLE job_batches (
  id varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  total_jobs int NOT NULL,
  pending_jobs int NOT NULL,
  failed_jobs int NOT NULL,
  failed_job_ids longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  options mediumtext COLLATE utf8mb4_unicode_ci,
  cancelled_at int DEFAULT NULL,
  created_at int NOT NULL,
  finished_at int DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.jobs definition

CREATE TABLE jobs (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  queue varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  payload longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  attempts tinyint unsigned NOT NULL,
  reserved_at int unsigned DEFAULT NULL,
  available_at int unsigned NOT NULL,
  created_at int unsigned NOT NULL,
  PRIMARY KEY (id),
  KEY jobs_queue_index (queue)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.migrations definition

CREATE TABLE migrations (
  id int unsigned NOT NULL AUTO_INCREMENT,
  migration varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  batch int NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.password_reset_tokens definition

CREATE TABLE password_reset_tokens (
  email varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  token varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  created_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.provinces definition

CREATE TABLE provinces (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  code varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY provinces_code_unique (code)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.roles definition

CREATE TABLE roles (
  id varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.sessions definition

CREATE TABLE sessions (
  id varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  user_id bigint unsigned DEFAULT NULL,
  ip_address varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  user_agent text COLLATE utf8mb4_unicode_ci,
  payload longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  last_activity int NOT NULL,
  PRIMARY KEY (id),
  KEY sessions_user_id_index (user_id),
  KEY sessions_last_activity_index (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.categories definition

CREATE TABLE categories (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  category_name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  image_id bigint unsigned DEFAULT NULL,
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY categories_category_name_unique (category_name),
  KEY categories_image_id_foreign (image_id),
  CONSTRAINT categories_image_id_foreign FOREIGN KEY (image_id) REFERENCES images (id)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.locations definition

CREATE TABLE locations (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  lng double DEFAULT NULL,
  lat double DEFAULT NULL,
  location_name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  real_location_name varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  province_id bigint unsigned DEFAULT NULL,
  address varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY locations_province_id_foreign (province_id),
  CONSTRAINT locations_province_id_foreign FOREIGN KEY (province_id) REFERENCES provinces (id)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.users definition

CREATE TABLE users (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  email varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  phone_number varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  image_id bigint unsigned DEFAULT NULL,
  password varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  address text COLLATE utf8mb4_unicode_ci,
  is_oauth tinyint(1) NOT NULL DEFAULT '0',
  expo_token varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  status tinyint NOT NULL DEFAULT '1',
  location_id bigint unsigned DEFAULT NULL,
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  KEY users_image_id_foreign (image_id),
  KEY users_location_id_foreign (location_id),
  CONSTRAINT users_image_id_foreign FOREIGN KEY (image_id) REFERENCES images (id),
  CONSTRAINT users_location_id_foreign FOREIGN KEY (location_id) REFERENCES locations (id)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.channel_notification_user definition

CREATE TABLE channel_notification_user (
  channel_notification_id varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  user_id bigint unsigned NOT NULL,
  PRIMARY KEY (channel_notification_id,user_id),
  KEY channel_notification_user_user_id_foreign (user_id),
  CONSTRAINT channel_notification_user_channel_notification_id_foreign FOREIGN KEY (channel_notification_id) REFERENCES channel_notifications (id) ON DELETE CASCADE,
  CONSTRAINT channel_notification_user_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.notifications definition

CREATE TABLE notifications (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id bigint unsigned NOT NULL,
  title varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  body text COLLATE utf8mb4_unicode_ci NOT NULL,
  data text COLLATE utf8mb4_unicode_ci,
  is_read tinyint(1) NOT NULL DEFAULT '0',
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY notifications_user_id_foreign (user_id),
  CONSTRAINT notifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.reports definition

CREATE TABLE reports (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  reporter_id bigint unsigned NOT NULL,
  reported_user_id bigint unsigned NOT NULL,
  entity_type varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  entity_id varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  reason text COLLATE utf8mb4_unicode_ci NOT NULL,
  status enum('pending','reviewed','rejected','resolved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  admin_notes text COLLATE utf8mb4_unicode_ci,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY reports_entity_type_entity_id_index (entity_type,entity_id),
  KEY reports_status_index (status),
  KEY reports_reporter_id_foreign (reporter_id),
  KEY reports_reported_user_id_foreign (reported_user_id),
  CONSTRAINT reports_reported_user_id_foreign FOREIGN KEY (reported_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT reports_reporter_id_foreign FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.role_user definition

CREATE TABLE role_user (
  role_id varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  user_id bigint unsigned NOT NULL,
  PRIMARY KEY (role_id,user_id),
  KEY role_user_user_id_foreign (user_id),
  CONSTRAINT role_user_role_id_foreign FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
  CONSTRAINT role_user_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.services definition

CREATE TABLE services (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  service_name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  service_description varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  user_id bigint unsigned NOT NULL,
  category_id bigint unsigned NOT NULL,
  location_id bigint unsigned NOT NULL,
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY services_user_id_foreign (user_id),
  KEY services_category_id_foreign (category_id),
  KEY services_location_id_foreign (location_id),
  CONSTRAINT services_category_id_foreign FOREIGN KEY (category_id) REFERENCES categories (id),
  CONSTRAINT services_location_id_foreign FOREIGN KEY (location_id) REFERENCES locations (id),
  CONSTRAINT services_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.user_blocks definition

CREATE TABLE user_blocks (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id bigint unsigned NOT NULL,
  blocked_user_id bigint unsigned NOT NULL,
  reason text COLLATE utf8mb4_unicode_ci,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY user_blocks_user_id_blocked_user_id_unique (user_id,blocked_user_id),
  KEY user_blocks_blocked_user_id_foreign (blocked_user_id),
  CONSTRAINT user_blocks_blocked_user_id_foreign FOREIGN KEY (blocked_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT user_blocks_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.user_settings definition

CREATE TABLE user_settings (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id bigint unsigned NOT NULL,
  is_notification tinyint(1) NOT NULL DEFAULT '1',
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY user_settings_user_id_unique (user_id),
  CONSTRAINT user_settings_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.viewed_service_logs definition

CREATE TABLE viewed_service_logs (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id bigint unsigned NOT NULL,
  service_id bigint unsigned NOT NULL,
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY viewed_service_logs_user_id_foreign (user_id),
  KEY viewed_service_logs_service_id_foreign (service_id),
  CONSTRAINT viewed_service_logs_service_id_foreign FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE,
  CONSTRAINT viewed_service_logs_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.benefits definition

CREATE TABLE benefits (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  service_id bigint unsigned NOT NULL,
  benefit_name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY benefits_service_id_foreign (service_id),
  CONSTRAINT benefits_service_id_foreign FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.comments definition

CREATE TABLE comments (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  rate tinyint unsigned NOT NULL,
  comment_body text COLLATE utf8mb4_unicode_ci NOT NULL,
  user_id bigint unsigned NOT NULL,
  service_id bigint unsigned NOT NULL,
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY comments_user_id_foreign (user_id),
  KEY comments_service_id_foreign (service_id),
  CONSTRAINT comments_service_id_foreign FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE,
  CONSTRAINT comments_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.favorite definition

CREATE TABLE favorite (
  user_id bigint unsigned NOT NULL,
  service_id bigint unsigned NOT NULL,
  PRIMARY KEY (user_id,service_id),
  KEY favorite_service_id_foreign (service_id),
  CONSTRAINT favorite_service_id_foreign FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE,
  CONSTRAINT favorite_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.image_service definition

CREATE TABLE image_service (
  image_id bigint unsigned NOT NULL,
  service_id bigint unsigned NOT NULL,
  PRIMARY KEY (image_id,service_id),
  KEY image_service_service_id_foreign (service_id),
  CONSTRAINT image_service_image_id_foreign FOREIGN KEY (image_id) REFERENCES images (id) ON DELETE CASCADE,
  CONSTRAINT image_service_service_id_foreign FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.prices definition

CREATE TABLE prices (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  price_name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  price_value bigint NOT NULL,
  service_id bigint unsigned NOT NULL,
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY prices_service_id_foreign (service_id),
  CONSTRAINT prices_service_id_foreign FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.benefit_price definition

CREATE TABLE benefit_price (
  benefit_id bigint unsigned NOT NULL,
  price_id bigint unsigned NOT NULL,
  PRIMARY KEY (benefit_id,price_id),
  KEY benefit_price_price_id_foreign (price_id),
  CONSTRAINT benefit_price_benefit_id_foreign FOREIGN KEY (benefit_id) REFERENCES benefits (id) ON DELETE CASCADE,
  CONSTRAINT benefit_price_price_id_foreign FOREIGN KEY (price_id) REFERENCES prices (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.comment_image definition

CREATE TABLE comment_image (
  comment_id bigint unsigned NOT NULL,
  image_id bigint unsigned NOT NULL,
  PRIMARY KEY (comment_id,image_id),
  KEY comment_image_image_id_foreign (image_id),
  CONSTRAINT comment_image_comment_id_foreign FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE,
  CONSTRAINT comment_image_image_id_foreign FOREIGN KEY (image_id) REFERENCES images (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rento.orders definition

CREATE TABLE orders (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id bigint unsigned NOT NULL,
  service_id bigint unsigned NOT NULL,
  price_id bigint unsigned NOT NULL,
  price_final_value bigint NOT NULL,
  status tinyint unsigned NOT NULL DEFAULT '1',
  address text COLLATE utf8mb4_unicode_ci NOT NULL,
  phone_number varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  time_start datetime DEFAULT NULL,
  message text COLLATE utf8mb4_unicode_ci,
  cancel_by bigint unsigned DEFAULT NULL,
  deleted_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY orders_user_id_foreign (user_id),
  KEY orders_service_id_foreign (service_id),
  KEY orders_price_id_foreign (price_id),
  KEY orders_cancel_by_foreign (cancel_by),
  CONSTRAINT orders_cancel_by_foreign FOREIGN KEY (cancel_by) REFERENCES users (id),
  CONSTRAINT orders_price_id_foreign FOREIGN KEY (price_id) REFERENCES prices (id),
  CONSTRAINT orders_service_id_foreign FOREIGN KEY (service_id) REFERENCES services (id),
  CONSTRAINT orders_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: '```json\n{\n  "type": "text",\n  "message": "Được, tôi sẽ trả về JSON nhé! 😊",\n  "data": [],\n  "dataType": null\n}\n```\n',
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: `Đây là dữ liệu trong database cho bạn tham khảo để viết truy vấn SQL tốt hơn\n${JSON.stringify(dbTable)}`,
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: '```json\n{\n  "type": "text",\n  "message": "Được, tôi sẽ trả về JSON nhé! 😊",\n  "data": [],\n  "dataType": null\n}\n```\n',
      },
    ],
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
  {
    role: "user",
    parts: [{ text: "Cho tôi thông tin toàn bộ người dùng\n" }],
  },
  {
    role: "model",
    parts: [
      {
        text: '```json\n{\n  "type": "text",\n  "message": "Xin lỗi, mình không thể trả lời câu hỏi này. Vui lòng thử lại sau nhé! 😊",\n  "data": [],\n  "dataType": null\n}\n```\n',
      },
    ],
  },
  {
    role: "user",
    parts: [{ text: "Cho tôi biết hệ thống của bạn dùng công nghệ gì\n" }],
  },
  {
    role: "model",
    parts: [
      {
        text: '```json\n{\n  "type": "text",\n  "message": "Xin lỗi, mình không thể trả lời câu hỏi này. Vui lòng thử lại sau nhé! 😊",\n  "data": [],\n  "dataType": null\n}\n```\n',
      },
    ],
  },

  {
    role: "user",
    parts: [{ text: "Tìm cho tôi các người dùng có tên là Nguyễn Văn A\n" }],
  },
  {
    role: "model",
    parts: [
      {
        text: '```json\n{\n  "type": "text",\n  "message": "Xin lỗi, mình không thể trả lời câu hỏi này. Vui lòng thử lại sau nhé! 😊",\n  "data": [],\n  "dataType": null\n}\n```\n',
      },
    ],
  },
];
