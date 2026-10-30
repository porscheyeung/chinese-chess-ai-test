# 中國象棋

- GitHub：porscheyeung/chinese_chess；目前入口為 index.html，其他 HTML 保留作歷史版本。
- 先讀 README.md。使用者要求只改善 AI 和將難度增至 1–10；其餘版面及操作保留。
- 引擎和背景 Worker 的程式來源同在 index.html，Worker 從目前腳本擷取共用規則及引擎，修改時需驗證兩條執行路徑。
- 檢查：node tests/ai.test.cjs；瀏覽器測試至少包含電腦先手、Worker 出棋及難度摘要。
- 保留現有公開狀態、網址、雙人模式、讓棋、悔棋與禁止第三次重複規則。不可將內部等級宣稱為正式段位或評分。
- 新版 AI 在分支 improve-ai-levels-1-10（草稿 PR #1，未合併）；同一內容推送到 porscheyeung/chinese-chess-ai-test 的 main 作測試網站 https://porscheyeung.github.io/chinese-chess-ai-test/ 。舊版 chinese_chess main 及其網站不可覆蓋。
- 推送需用 porscheyeung 帳戶憑證（gh 預設帳戶 lphky 無權限）；不要切換 gh 預設帳戶。
