# Household OS

家計管理を行うためのWebアプリ。

## 基本方針

- 機能ごとにコードを分離する
- 共通処理と個別機能を分ける
- 1つのファイルに処理を集中させない
- 新機能を追加しやすい構造にする
- 既存機能への影響をできるだけ小さくする
- OS本体と家計簿アプリを分離する

## ディレクトリ構成

```text
household-os/
├─ index.html
├─ css/
│  └─ style.css
├─ js/
│  ├─ core/
│  │  └─ app.js
│  ├─ features/
│  │  └─ 各機能
│  └─ pages/
│     └─ 各画面
└─ README.md
