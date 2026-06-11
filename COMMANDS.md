# ForeverDays – Lệnh thường dùng

> Chạy tất cả lệnh từ thư mục **root** `d:\GitHub\ForeverDays`

## 🌐 Web

| Lệnh | Chức năng |
|---|---|
| `npm run web:dev` | Chạy web dev server → http://localhost:5173 |
| `npm run web:build` | Build web production (xuất ra `apps/web/dist/`) |

## 📦 Core Package

| Lệnh | Chức năng |
|---|---|
| `npm run core:build` | Build lại `packages/core` (bắt buộc sau khi sửa code trong core) |

> ⚠️ **Lưu ý:** Mỗi khi sửa file trong `packages/core/src/`, phải chạy `npm run core:build` trước thì web/mobile mới nhận được thay đổi.

## 📱 Mobile (Expo)

| Lệnh | Chức năng |
|---|---|
| `npm run mobile:start` | Start Expo dev server |
| `npm run mobile:android` | Chạy trên Android (cần máy ảo hoặc thiết bị thật) |
| `npm run mobile:ios` | Chạy trên iOS (chỉ trên macOS) |
| `npm run mobile:web` | Chạy mobile phiên bản web |

## 🔄 Workflow thường gặp

### Sửa code web → chạy thử
```bash
npm run web:dev
```

### Sửa code trong core → rebuild rồi mới xem kết quả
```bash
npm run core:build
# Vite sẽ tự hot-reload sau khi build xong
```

### Build production
```bash
npm run core:build
npm run web:build
```

### Build Android APK (Preview)
```bash
cd apps/mobile
eas build --platform android --profile preview
```
Dinh Quoc Tuan Dát