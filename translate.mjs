const API_KEY = '';

const translate = async text => {
  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target: 'en' }),
      }
    );
    const data = await response.json();
    console.log('Перевод:', data?.data?.translations[0]?.translatedText || 'Ошибка');
  } catch (e) {
    console.error('Ошибка:', e);
  }
};

translate('Заїбало все мене. В мене мігрень, відчепіться від мене.');
