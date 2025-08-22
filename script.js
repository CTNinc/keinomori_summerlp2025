// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', function() {
    // CSRFトークンの生成と設定
    generateCSRFToken();
    
    // フォームのバリデーション
    setupFormValidation();
    
    // 日付フィールドの最小値を今日に設定
    setupDateField();
    
    // エラーメッセージと成功メッセージの表示
    displayMessages();
});

// CSRFトークンの生成
function generateCSRFToken() {
    const token = Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
    
    // セッションストレージに保存
    sessionStorage.setItem('csrf_token', token);
    
    // フォームに隠しフィールドとして設定
    const tokenInput = document.getElementById('csrf_token');
    if (tokenInput) {
        tokenInput.value = token;
    }
}

// フォームバリデーションの設定
function setupFormValidation() {
    const form = document.querySelector('.contact-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        if (!validateForm()) {
            e.preventDefault();
            return false;
        }
        
        // 送信ボタンを無効化（二重送信防止）
        const submitBtn = form.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '送信中...';
        }
    });
}

// フォームのバリデーション
function validateForm() {
    let isValid = true;
    const errors = [];
    
    // 必須項目のチェック
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (field.type === 'radio' || field.type === 'checkbox') {
            const name = field.name;
            const checked = form.querySelector(`input[name="${name}"]:checked`);
            if (!checked) {
                errors.push(`${getFieldLabel(field)}を選択してください。`);
                isValid = false;
            }
        } else if (field.type === 'select-one') {
            if (!field.value) {
                errors.push(`${getFieldLabel(field)}を選択してください。`);
                isValid = false;
            }
        } else {
            if (!field.value.trim()) {
                errors.push(`${getFieldLabel(field)}を入力してください。`);
                isValid = false;
            }
        }
    });
    
    // メールアドレスの形式チェック
    const emailField = form.querySelector('input[name="email"]');
    if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            errors.push('正しいメールアドレスを入力してください。');
            isValid = false;
        }
    }
    
    // 電話番号の形式チェック
    const phoneField = form.querySelector('input[name="phone"]');
    if (phoneField && phoneField.value) {
        const phoneRegex = /^[0-9]+$/;
        if (!phoneRegex.test(phoneField.value)) {
            errors.push('電話番号は数字のみで入力してください（ハイフンなし）。');
            isValid = false;
        }
    }
    
    // エラーがある場合はアラート表示
    if (errors.length > 0) {
        alert('以下のエラーがあります：\n\n' + errors.join('\n'));
    }
    
    return isValid;
}

// フィールドのラベルを取得
function getFieldLabel(field) {
    const label = field.closest('.form-group').querySelector('label');
    if (label) {
        return label.textContent.replace(' *', '');
    }
    return 'この項目';
}

// 日付フィールドの設定
function setupDateField() {
    const dateField = document.querySelector('input[name="visit_date"]');
    if (dateField) {
        // 今日の日付を取得
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        
        // 最小値を今日に設定（過去の日付を選択できないように）
        dateField.min = todayString;
        
        // 初期値は設定しない（「年/月/日」を表示するため）
    }
}

// 電話番号フィールドの入力制限
document.addEventListener('input', function(e) {
    if (e.target.name === 'phone') {
        // 数字以外の文字を除去
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }
});

// ラジオボタンとチェックボックスのカスタムスタイル
document.addEventListener('change', function(e) {
    if (e.target.type === 'radio' || e.target.type === 'checkbox') {
        const customElement = e.target.nextElementSibling;
        if (customElement && customElement.classList.contains('radio-custom')) {
            // ラジオボタンの場合、同じnameの他の要素のカスタムスタイルをリセット
            if (e.target.type === 'radio') {
                const name = e.target.name;
                document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
                    input.nextElementSibling.classList.remove('checked');
                });
            }
            
            // 現在の要素のカスタムスタイルを更新
            if (e.target.checked) {
                customElement.classList.add('checked');
            } else {
                customElement.classList.remove('checked');
            }
        }
    }
});

// エラーメッセージと成功メッセージの表示
function displayMessages() {
    // 成功メッセージの表示
    const successMessage = sessionStorage.getItem('success_message');
    if (successMessage) {
        const successElement = document.getElementById('success-message');
        if (successElement) {
            successElement.textContent = successMessage;
            successElement.style.display = 'block';
        }
        sessionStorage.removeItem('success_message');
    }
    
               // エラーメッセージの表示
           const formErrors = sessionStorage.getItem('form_errors');
           if (formErrors) {
               try {
                   const errors = JSON.parse(formErrors);
                   Object.keys(errors).forEach(fieldName => {
                                               // 車種選択と来店希望店舗のエラーメッセージ表示
                        if (fieldName === 'car_type' || fieldName === 'store') {
                            const field = document.querySelector(`[name="${fieldName}"]`);
                            if (field) {
                                const formGroup = field.closest('.form-group');
                                if (formGroup) {
                                    const errortxt = formGroup.querySelector('.errortxt');
                                    if (errortxt) {
                                        errortxt.textContent = errors[fieldName];
                                        errortxt.style.display = 'block';
                                    }
                                }
                            }
                        } else if (fieldName === 'privacy_agree') {
                            // プライバシーポリシーのエラーメッセージ表示
                            const field = document.querySelector(`[name="${fieldName}"]`);
                            if (field) {
                                const formGroup = field.closest('.form-group');
                                if (formGroup) {
                                    const privacypolicy = formGroup.querySelector('.privacypolicy');
                                    if (privacypolicy) {
                                        privacypolicy.classList.add('is_invalid');
                                    }
                                }
                            }
                        } else {
                            // その他のフィールドのエラーメッセージ表示
                            const errorElement = document.getElementById(fieldName + '_error');
                            if (errorElement) {
                                errorElement.textContent = errors[fieldName];
                            }
                        }
                   });
               } catch (e) {
                   console.error('Error parsing form errors:', e);
               }
               sessionStorage.removeItem('form_errors');
           }
    
    // フォームデータの復元
    const formData = sessionStorage.getItem('form_data');
    if (formData) {
        try {
            const data = JSON.parse(formData);
            Object.keys(data).forEach(fieldName => {
                const field = document.querySelector(`[name="${fieldName}"]`);
                if (field) {
                    if (field.type === 'radio' || field.type === 'checkbox') {
                        if (field.value === data[fieldName]) {
                            field.checked = true;
                        }
                    } else {
                        field.value = data[fieldName];
                    }
                }
            });
        } catch (e) {
            console.error('Error parsing form data:', e);
        }
        sessionStorage.removeItem('form_data');
    }
}

// 送信ボタンのホバーエフェクト
document.addEventListener('mouseenter', function(e) {
    if (e.target && e.target.classList && e.target.classList.contains('submit-btn')) {
        const arrow = e.target.querySelector('.arrow');
        if (arrow) {
            arrow.style.transform = 'translateX(5px)';
        }
    }
});

document.addEventListener('mouseleave', function(e) {
    if (e.target && e.target.classList && e.target.classList.contains('submit-btn')) {
        const arrow = e.target.querySelector('.arrow');
        if (arrow) {
            arrow.style.transform = 'translateX(0)';
        }
    }
});

// CTAボタンのイベント設定
function setupCTAButtons() {
    // 1つ目のCTAセクション（sp_btn.png）
    const spBtn1 = document.getElementById('sp-btn-1');
    if (spBtn1) {
        spBtn1.addEventListener('click', function() {
            // セール情報1のセクション（sale1.pngを含む）にスクロール
            const sale1Img = document.querySelector('img[src*="sale1.png"]');
            if (sale1Img) {
                const sale1Section = sale1Img.closest('section');
                if (sale1Section) {
                    sale1Section.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // 1つ目のCTAセクション（tel_btn.png）
    const telBtn1 = document.getElementById('tel-btn-1');
    if (telBtn1) {
        telBtn1.addEventListener('click', function() {
            // 電話モーダルを表示
            const modal = document.getElementById('tel-modal');
            if (modal) {
                modal.style.display = 'block';
            }
        });
    }

    // 2つ目のCTAセクション（CTA1.png）
    const spBtn2 = document.getElementById('sp-btn-2');
    if (spBtn2) {
        spBtn2.addEventListener('click', function() {
            // セール情報1のセクション（sale1.pngを含む）にスクロール
            const sale1Img = document.querySelector('img[src*="sale1.png"]');
            if (sale1Img) {
                const sale1Section = sale1Img.closest('section');
                if (sale1Section) {
                    sale1Section.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // 2つ目のCTAセクション（CTA2.png）
    const telBtn2 = document.getElementById('tel-btn-2');
    if (telBtn2) {
        telBtn2.addEventListener('click', function() {
            // 電話モーダルを表示
            const modal = document.getElementById('tel-modal');
            if (modal) {
                modal.style.display = 'block';
            }
        });
    }

    // 3つ目のCTAセクション（sp_btn.png）
    const spBtn3 = document.getElementById('sp-btn-3');
    if (spBtn3) {
        spBtn3.addEventListener('click', function() {
            // セール情報1のセクション（sale1.pngを含む）にスクロール
            const sale1Img = document.querySelector('img[src*="sale1.png"]');
            if (sale1Img) {
                const sale1Section = sale1Img.closest('section');
                if (sale1Section) {
                    sale1Section.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // 3つ目のCTAセクション（tel_btn.png）
    const telBtn3 = document.getElementById('tel-btn-3');
    if (telBtn3) {
        telBtn3.addEventListener('click', function() {
            // 電話モーダルを表示
            const modal = document.getElementById('tel-modal');
            if (modal) {
                modal.style.display = 'block';
            }
        });
    }

    // ヘッダーロゴ（軽の森）クリックで外部サイトへ
    const headerLogo = document.querySelector('img.header-img[alt="軽の森"]');
    if (headerLogo) {
        headerLogo.style.cursor = 'pointer';
        headerLogo.addEventListener('click', function() {
            window.location.href = 'https://keinomori.com/';
        });
    }

    // ヘッダー店舗情報画像クリックでページ内スクロール
    const headerStore = document.querySelector('img.header-img[alt="店舗情報"]');
    if (headerStore) {
        headerStore.style.cursor = 'pointer';
        headerStore.addEventListener('click', function() {
            const storeImg = document.querySelector('img[alt="store.png"], img.store-img');
            if (storeImg) {
                storeImg.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // sale2.pngクリックでinquiry.pngのところまでスクロール
    const sale2Img = document.querySelector('img[alt="sale2.png"], img[src*="sale2.png"]');
    if (sale2Img) {
        sale2Img.style.cursor = 'pointer';
        sale2Img.addEventListener('click', function() {
            const inquiryImg = document.querySelector('img[alt="inquiry.png"], img.inquiry-img');
            if (inquiryImg) {
                inquiryImg.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
}

// CTAセクションの位置を動的に変更（追従機能なし）
function updateCTAPosition() {
    // 追従機能は無効化されているため、何もしない
    return;
}

// モーダルのイベント設定
function setupModal() {
    const modal = document.getElementById('tel-modal');
    const closeBtn = document.querySelector('.tel-modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // モーダル外をクリックしても閉じる
            if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    setupDateField();
    displayMessages();
    setupCTAButtons();
    setupModal();
    
    // スクロールイベントリスナーを追加
    window.addEventListener('scroll', updateCTAPosition);
    
    // 初期位置を設定
    updateCTAPosition();
});
