<?php
// 文字エンコーディング設定
header('Content-Type: application/json; charset=UTF-8');

// エラーレポート設定
error_reporting(E_ALL);
ini_set('display_errors', 0); // エラーを表示しない

// メール送信のデバッグ情報をログに記録
error_log('contact.php 実行開始 - 時刻: ' . date('Y-m-d H:i:s'));
error_log('POST データ: ' . print_r($_POST, true));

// セッション開始
session_start();

// フォームがPOSTで送信されたかチェック
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode([
    'success' => false,
    'message' => '不正なリクエストです。'
  ]);
  exit;
}

// CSRF対策（セッションストレージから取得）
$csrf_token = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : '';
if (empty($csrf_token)) {
  echo json_encode([
    'success' => false,
    'message' => 'CSRFトークンが設定されていません。'
  ]);
  exit;
}

// 入力値の取得とサニタイズ
$car_type = isset($_POST['car_type']) ? htmlspecialchars($_POST['car_type'], ENT_QUOTES, 'UTF-8') : '';
$name = isset($_POST['name']) ? htmlspecialchars($_POST['name'], ENT_QUOTES, 'UTF-8') : '';
$name_kana = isset($_POST['name_kana']) ? htmlspecialchars($_POST['name_kana'], ENT_QUOTES, 'UTF-8') : '';
$email = isset($_POST['email']) ? htmlspecialchars($_POST['email'], ENT_QUOTES, 'UTF-8') : '';
$phone = isset($_POST['phone']) ? htmlspecialchars($_POST['phone'], ENT_QUOTES, 'UTF-8') : '';
$visit_date = isset($_POST['visit_date']) ? htmlspecialchars($_POST['visit_date'], ENT_QUOTES, 'UTF-8') : '';
$visit_time = isset($_POST['visit_time']) ? htmlspecialchars($_POST['visit_time'], ENT_QUOTES, 'UTF-8') : '';
$store = isset($_POST['store']) ? htmlspecialchars($_POST['store'], ENT_QUOTES, 'UTF-8') : '';
$message_content = isset($_POST['message']) ? htmlspecialchars($_POST['message'], ENT_QUOTES, 'UTF-8') : '';
$privacy_agree = isset($_POST['privacy_agree']) ? true : false;

// バリデーション
$errors = [];

// 必須項目チェック
if (empty($car_type)) {
  $errors['car_type'] = 'お問い合わせ希望車種を選択してください。';
}

if (empty($name)) {
  $errors['name'] = 'お名前を入力してください。';
}

if (empty($name_kana)) {
  $errors['name_kana'] = 'お名前（ふりがな）を入力してください。';
}

if (empty($email)) {
  $errors['email'] = 'メールアドレスを入力してください。';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  $errors['email'] = '正しいメールアドレスを入力してください。';
}

if (empty($phone)) {
  $errors['phone'] = '電話番号を入力してください。';
} elseif (!preg_match('/^[0-9]+$/', $phone)) {
  $errors['phone'] = '電話番号は数字のみで入力してください（ハイフンなし）。';
}

if (empty($visit_date)) {
  $errors['visit_date'] = '来店希望日を選択してください。';
}

if (empty($visit_time)) {
  $errors['visit_time'] = '来店希望時間を選択してください。';
}

if (empty($store)) {
  $errors['store'] = '来店希望店舗を選択してください。';
}

if (!$privacy_agree) {
  $errors['privacy_agree'] = 'プライバシーポリシーに同意してください。';
}

// エラーがある場合はJSONでエラーを返す
if (!empty($errors)) {
  echo json_encode([
    'success' => false,
    'message' => '入力内容にエラーがあります。',
    'errors' => $errors
  ]);
  exit;
}

// メール送信処理
$to = 'daichi202405@gmail.com'; // 会社宛てのメールアドレス
$cc = 'daichi7558@gmail.com'; // CC
$subject = '軽の森 お問い合わせフォーム - ' . $car_type;

// メールヘッダー設定
$headers = [];
$headers[] = 'From: 軽の森 <noreply@keinomori.com>';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'Cc: ' . $cc;
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

// メール本文作成（会社宛て）
$message = "以下の内容でお問い合わせがありました。\n\n";
$message .= "【お客様情報】\n";
$message .= "お名前: " . $name . "\n";
$message .= "フリガナ: " . $name_kana . "\n";
$message .= "電話番号: " . $phone . "\n";
$message .= "メールアドレス: " . $email . "\n";
$message .= "車種: " . $car_type . "\n";
$message .= "来店希望店舗: " . $store . "\n";
$message .= "来店希望日: " . $visit_date . "\n";
$message .= "来店希望時間: " . $visit_time . "\n";
$message .= "お問い合わせ内容: " . $message_content . "\n";
$message .= "プライバシーポリシー同意: " . ($privacy_agree ? '同意' : '未同意') . "\n\n";
$message .= "送信日時: " . date('Y-m-d H:i:s') . "\n";

// 会社宛てメール送信
$mail_sent = mail($to, $subject, $message, implode("\r\n", $headers));

// メール送信の確認とログ記録
if (!$mail_sent) {
  $error = error_get_last();
  $error_message = isset($error['message']) ? $error['message'] : '不明なエラー';
  error_log('会社宛てメール送信失敗 - 送信先: ' . $to . ', エラー: ' . $error_message);

  echo json_encode([
    'success' => false,
    'message' => 'メール送信に失敗しました。しばらく時間をおいて再度お試しください。'
  ]);
  exit;
} else {
  error_log('会社宛てメール送信成功 - 送信先: ' . $to . ', 件名: ' . $subject);
}

// お客様宛て自動返信メール
$auto_reply_subject = '【軽の森】お問い合わせありがとうございます - ' . $car_type;
$auto_reply_body = $name . " 様\n\n";
$auto_reply_body .= "この度は軽の森にお問い合わせいただき、ありがとうございます。\n\n";
$auto_reply_body .= "以下の内容でお問い合わせを受け付けました。\n";
$auto_reply_body .= "担当者より順次ご連絡いたしますので、しばらくお待ちください。\n\n";
$auto_reply_body .= "【お問い合わせ内容】\n";
$auto_reply_body .= "車種: " . $car_type . "\n";
$auto_reply_body .= "来店希望日時: " . $visit_date . " " . $visit_time . "\n";
$auto_reply_body .= "来店希望店舗: " . $store . "\n";
$auto_reply_body .= "お問い合わせ内容: " . $message_content . "\n\n";
$auto_reply_body .= "【軽の森】\n";
$auto_reply_body .= "〒591-8025 大阪府堺市北区長曽根町3083-10\n";
$auto_reply_body .= "TEL: 072-240-0809\n\n";
$auto_reply_body .= "※このメールは自動送信されています。\n";
$auto_reply_body .= "※返信はできませんので、ご了承ください。\n";

$auto_reply_headers = "From: 軽の森 <noreply@keinomori.com>\r\n";
$auto_reply_headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// お客様宛てメール送信
$auto_reply_sent = mail($email, $auto_reply_subject, $auto_reply_body, $auto_reply_headers);

// 自動返信メールの確認とログ記録
if (!$auto_reply_sent) {
  $error = error_get_last();
  $error_message = isset($error['message']) ? $error['message'] : '不明なエラー';
  error_log('お客様宛て自動返信メール送信失敗 - 送信先: ' . $email . ', エラー: ' . $error_message);
} else {
  error_log('お客様宛て自動返信メール送信成功 - 送信先: ' . $email . ', 件名: ' . $auto_reply_subject);
}

// 送信完了後、JSONレスポンスを返す
echo json_encode([
  'success' => true,
  'message' => 'お問い合わせを受け付けました。担当者より順次ご連絡いたしますので、しばらくお待ちください。'
]);
exit;
