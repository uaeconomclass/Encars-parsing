const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());


// 📁 Файл для сохранения текущей страницы
const PAGE_STATE_FILE = path.join(__dirname, 'last_page_kor.json');

// 💾 Сохраняем текущую страницу в файл
const saveCurrentPage = (pageNum) => {
	fs.writeFileSync(PAGE_STATE_FILE, JSON.stringify({ page: pageNum }), 'utf8');
};

// 📂 Загружаем последнюю сохранённую страницу
const loadLastPage = () => {
	try {
		const data = fs.readFileSync(PAGE_STATE_FILE, 'utf8');
		const parsed = JSON.parse(data);
		return parsed.page || 1;
	} catch (e) {
		return 1; // Если файл не существует или повреждён — начинаем с первой
	}
};

(async () => {
	const browser = await puppeteer.launch({
		headless: 'new',
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-blink-features=AutomationControlled',
			'--disable-infobars',
			'--window-size=1920,1080',
			'--ignore-certificate-errors',
			'--ignore-certificate-errors-spki-list',
			'--allow-running-insecure-content',
			'--disable-web-security',
			'--disable-features=IsolateOrigins,site-per-process',
			'--unsafely-treat-insecure-origin-as-secure=http://www.encar.com'
		],
		defaultViewport: null
	});

	const page = await browser.newPage();

	await page.setUserAgent(
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
	);

	await page.setExtraHTTPHeaders({ 'Upgrade-Insecure-Requests': '0' });

	page.on('console', msg => console.log('🧠 [browser]', msg.text()));

	// 📅 Получаем дату 5 лет назад
	const getDateFiveYearsAgo = () => {
		const now = new Date();
		now.setFullYear(now.getFullYear() - 5);
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		return `${year}${month}`;
	};

	const dateRange = getDateFiveYearsAgo();
	let currentPage = loadLastPage(); // 🔄 Восстанавливаем из файла

	// 🔗 Формирование URL
	const buildUrl = (pageNumber) => {
		return `http://www.encar.com/dc/dc_carsearchlist.do?carType=kor#!%7B%22action%22%3A%22(And.Hidden.N._.CarType.Y._.Year.range(${dateRange}..).)%22%2C%22toggle%22%3A%7B%7D%2C%22layer%22%3A%22%22%2C%22sort%22%3A%22ModifiedDate%22%2C%22page%22%3A${pageNumber}%2C%22limit%22%3A%2220%22%2C%22searchKey%22%3A%22%22%2C%22loginCheck%22%3Afalse%7D`;
	};

	// 🧩 Извлечение ID
	/*const extractIds = async () => {
		return await page.evaluate(() => {
			const rows = document.querySelectorAll('#sr_normal tr[data-impression]');
			return Array.from(rows)
				.map(row => row.getAttribute('data-impression')?.split('|')[0])
				.filter(Boolean);
		});
	};*/

	// 🧩 Извлечение ID и названия (временный лог)
	const extractIds = async () => {
		return await page.evaluate(() => {
			const rows = document.querySelectorAll('#sr_normal tr[data-impression]');
			const data = Array.from(rows).map(row => {
				const id = row.getAttribute('data-impression')?.split('|')[0];
				const name = row.querySelector('.cls')?.innerText.trim() || 'Без названия';
				console.log(`🚗 ${id} — ${name}`); // 👈 вывод прямо в консоль браузера
				return id;
			});
			return data.filter(Boolean);
		});
	};
	/*
	
// 🧩 Извлечение ID и названия только из блока "일반등록"
const extractIds = async () => {
	return await page.evaluate(() => {
		
		
		
  // шукаємо всі секції з класом section list
  const sections = document.querySelectorAll('div.section.list');
  sections.forEach(section => {
    const title = section.querySelector('h4')?.innerText.trim();
    if (title !== '일반등록') {
      section.remove(); // 💣 видаляємо всі, що не “일반등록”
    }
  });
  console.log('✅ Залишився тільки блок 일반등록');
		
		
		
		
		// шукаємо блок, у якому є заголовок "일반등록"
		const section = Array.from(document.querySelectorAll('div.section.list'))
			.find(div => div.querySelector('h4')?.innerText.includes('일반등록'));

		if (!section) {
			console.log('⚠️ Блок 일반등록 не знайдено.');
			return [];
		}

		// шукаємо таблицю з оголошеннями
		const table = section.querySelector('table.car_list');
		if (!table) {
			console.log('⚠️ Таблицю в 일반등록 не знайдено.');
			return [];
		}

		// беремо всі рядки з data-impression
		const rows = table.querySelectorAll('tr[data-impression]');
		const data = Array.from(rows).map(row => {
			const id = row.getAttribute('data-impression')?.split('|')[0];
			const name = row.querySelector('.cls')?.innerText.trim() || 'Без названия';
			console.log(`🚗 ${id} — ${name}`);
			return id;
		});

		return data.filter(Boolean);
	});
};

	*/
	
	

	// 📤 Отправка ID на сервер
	const processData = async (ids) => {
		const uniqueIds = ids;

		if (uniqueIds.length > 0) {
			const requestUrl = `https://rublevkacars.ru/fastimport.php?vehicleIds=${uniqueIds.join(',')}`;
			console.log(`🚀 Отправка GET-запроса: ${requestUrl}`);
			try {
				const response = await axios.get(requestUrl);
				console.log('✅ Ответ:', response.data);
			} catch (error) {
				console.error('❌ Ошибка запроса:', error.message);
			}
		} else {
			console.log('ℹ️ Новых ID не найдено.');
		}
	};

	// 📄 Переход на следующую страницу
	const goToNextPage = async () => {
		const pageInfo = await page.evaluate(() => {
			const current = document.querySelector('#pagination .page a.current');
			const currentPage = current ? parseInt(current.dataset.page) : 1;

			const nextBtn = document.querySelector('#pagination .next a');
			const nextExists = !!nextBtn;

			const allPages = Array.from(document.querySelectorAll('#pagination .page a'))
				.map(a => parseInt(a.dataset.page))
				.filter(Boolean);
			const lastPage = allPages.length ? Math.max(...allPages) : currentPage;

			return { currentPage, nextExists, lastPage };
		});

		if (pageInfo.nextExists) {
			currentPage = pageInfo.currentPage + 1;
			console.log(`➡️ Переходим на следующую страницу: ${currentPage}`);
		} else {
			if (pageInfo.currentPage === pageInfo.lastPage) {
				currentPage = 1;
				console.log('🔁 Достигнута последняя страница. Возвращаемся на первую.');

				// 🛑 Останавливаем скрипт
				console.log('✅ Конец цикла. Скрипт завершает работу.');
				await browser.close();
				process.exit(0);
			} else {
				currentPage = pageInfo.currentPage + 1;
				console.log(`➡️ Переходим на страницу: ${currentPage}`);
			}
		}

		saveCurrentPage(currentPage); // 💾 сохраняем страницу

		await page.evaluate((targetPage) => {
			const target = document.querySelector(`#pagination a[data-page="${targetPage}"]`);
			if (target) target.click();
		}, currentPage);
		
		await page.waitForNavigation({ waitUntil: 'networkidle2' });
		console.log('🌍 Текущий URL после перехода:', page.url());

		await new Promise(resolve => setTimeout(resolve, 100));
	
		
	};

	// 🔄 Основной цикл
	const scanLoop = async () => {
		try {
			await page.reload({ waitUntil: 'networkidle2' });
			console.log('🔄 Страница перезагружена.');

			const ids = await extractIds();
			console.log(`🔍 Найдено ID (${ids.length}):`, ids);

			await processData(ids);
			await goToNextPage();
		} catch (err) {
			console.error('❗ Ошибка в цикле:', err.message);
			console.error('🚨 Завершаем процесс для перезапуска...');
			await browser.close();
			process.exit(1);
		} finally {
			setTimeout(scanLoop, 3000); // Рекурсивный таймер
		}
	};

	// 🚀 Старт
	try {
		const startUrl = buildUrl(currentPage);
		console.log(`🌐 Загружаем страницу ${currentPage}...`);
		await page.goto(startUrl, { waitUntil: 'networkidle2' });
		const initialIds = await extractIds();
		console.log(`🧩 Начальные ID (${initialIds.length}):`, initialIds);
		await processData(initialIds);

		scanLoop(); // Запускаем цикл
	} catch (error) {
		console.error('💥 Фатальная ошибка при старте:', error.message);
		await browser.close();
		process.exit(1);
	}
})();
