import fs from 'fs';
import path from 'path';

const ALLOWED_FILES = [
  'package.json',
  'vite.config.ts',
  'src/App.tsx',
  'src/firebase.ts',
  'src/types.ts',
  'src/components/RecommendationModal.tsx',
  'src/components/RecordDetail.tsx',
  'src/components/RecordForm.tsx',
  'src/components/Dashboard.tsx',
  'src/components/AuthScreen.tsx',
  'src/index.css',
  'index.html',
  'src/main.tsx',
  '.env.example'
];

// Read the metadata.json for accurate name/description
let projectName = "Twinbird Coffee App";
let description = "コーヒー豆や抽出情報を記録・管理し、AI（Gemini API）によるおすすめ豆の提案や抽出アドバイスを受けられるアプリケーション。";
try {
  const metadata = JSON.parse(fs.readFileSync('/metadata.json', 'utf8'));
  if (metadata.name) projectName = metadata.name;
  if (metadata.description) description = metadata.description;
} catch (e) {
  // Ignore
}

const fileContents = {};

ALLOWED_FILES.forEach(relativePath => {
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    fileContents[relativePath] = content;
  } catch (e) {
    console.error("Failed to read", relativePath, e);
  }
});

const checkpoint = {
  project_name: projectName,
  description: description,
  tech_stack: [
    "React (Vite)",
    "TypeScript",
    "Tailwind CSS",
    "Firebase (Auth, Firestore)",
    "Google Gemini API (@google/genai)",
    "React Router",
    "Lucide React (Icons)"
  ],
  files: fileContents,
  key_decisions: [
    "Firebase Firestoreをバックエンドデータベースとして採用し、リアルタイム同期とオフラインサポートを活用。",
    "Google Authを利用したシンプルな認証フローの構築。",
    "@google/genai SDKを使用して、Twinbirdコーヒーメーカーの仕様に特化したAI抽出アドバイスと、好みに合わせた豆の提案機能を実装。",
    "抽出アドバイス機能とおすすめ豆の提案機能で共通のGEMINI_API_KEYを使用するよう設計。",
    "APIキー無効（HTTP 400エラー）などのエラーハンドリングを強化し、ユーザーに分かりやすい日本語メッセージと再生成のUIを提供。",
    "Tailwind CSSを用いたモダンで暖かみのあるUI（stone/amber系のカラーパレット）の採用。"
  ],
  current_tasks: [
    "APIキーの有効性を確認し、AI機能（抽出アドバイス・おすすめ豆提案）が正常に動作するか継続的にテストする。",
    "ユーザー体験向上のため、豆の記録項目や抽出モードの拡張要望があれば対応する。"
  ],
  instructions: "今後機能を追加・修正する際は、以下の制約を守ること：\n1. TypeScriptの型定義（src/types.ts）を厳守し、不足があれば拡張すること。\n2. UIはTailwind CSSを使用し、既存のカラースキーム（stone色とamber色の組み合わせ）を維持すること。\n3. Gemini APIへのリクエスト時は、必ずtry-catchでエラーハンドリングを行い、APIキー不備などのエラーをユーザーに見えやすい形で通知すること。\n4. Firebase連携はセキュリティルール（firestore.rules）を尊重し、所有者のみが自身のデータをCRUDできる制約を守ること。"
};

fs.writeFileSync('/checkpoint.json', JSON.stringify(checkpoint, null, 2));
console.log("Successfully generated checkpoint.json. Included count: " + Object.keys(fileContents).length);
