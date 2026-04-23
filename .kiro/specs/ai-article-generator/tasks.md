# План реализации: AI Article Generator

## Обзор

Реализация Python CLI-инструмента для генерации и публикации статей. Задачи выстроены инкрементально: каждый шаг строится на предыдущем и заканчивается интеграцией компонентов.

## Задачи

- [x] 1. Настройка структуры проекта и конфигурации
  - [x] 1.1 Создать структуру проекта и файлы зависимостей
    - Создать `pyproject.toml` или `requirements.txt` с зависимостями: `google-generativeai`, `requests`, `python-dotenv`, `hypothesis`, `pytest`
    - Создать директории: `src/ai_article_generator/`, `tests/`
    - Создать `src/ai_article_generator/__init__.py`, `src/ai_article_generator/models.py`
    - _Требования: 6.1_
  - [x] 1.2 Реализовать модели данных в `models.py`
    - Реализовать dataclass-ы: `PipelineInput`, `Article`, `ImageData`, `MediaItem`, `PublishResult`
    - _Требования: 1.2, 2.2, 4.4, 5.5_
  - [x] 1.3 Реализовать `ConfigLoader` в `config.py`
    - Читать переменные из `.env` и окружения через `python-dotenv`
    - Валидировать наличие обязательных параметров: `WP_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`, `GEMINI_API_KEY`
    - Бросать `ConfigError` с именем отсутствующего параметра
    - Создать `.env.example` с описанием всех параметров
    - _Требования: 6.1, 6.2, 6.3_
  - [x] 1.4 Написать property-тест для ConfigLoader
    - **Property 6: Отсутствие обязательного параметра конфигурации вызывает ошибку**
    - **Validates: Requirements 6.2**
    - `# Feature: ai-article-generator, Property 6: missing config param raises ConfigError`

- [x] 2. Реализовать TextGenerator (Gemini API)
  - [x] 2.1 Реализовать `TextGenerator` в `text_generator.py`
    - Формировать системный промт, требующий вернуть JSON с полями `title`, `body`, `meta_description`, `image_prompts`
    - Парсить JSON-ответ Gemini и возвращать объект `Article`
    - Бросать `TextGenerationError` при ошибке API или некорректном JSON
    - _Требования: 1.1, 1.2, 1.3, 1.5, 2.4_
  - [x] 2.2 Реализовать валидацию промта в `validators.py`
    - Функция `validate_prompt(prompt: str)` — бросает `ValidationError` для пустых и пробельных строк
    - _Требования: 1.4_
  - [x] 2.3 Написать property-тест для валидации промта
    - **Property 1: Пустой промт отклоняется без вызова API**
    - **Validates: Requirements 1.4**
    - `# Feature: ai-article-generator, Property 1: whitespace prompt raises ValidationError`
  - [x] 2.4 Написать property-тест для структуры Article
    - **Property 7: image_prompts содержит 2–3 непустые строки**
    - **Validates: Requirements 1.2, 2.4**
    - `# Feature: ai-article-generator, Property 7: article image_prompts has 2-3 non-empty strings`
  - [x] 2.5 Написать unit-тесты для TextGenerator
    - Тест парсинга корректного JSON-ответа
    - Тест обработки некорректного JSON (бросает TextGenerationError)
    - Тест обработки ошибки API (бросает TextGenerationError с сообщением)
    - _Требования: 1.3, 1.5_

- [x] 3. Реализовать ImageGenerator (Pollinations.ai)
  - [x] 3.1 Реализовать `ImageGenerator` в `image_generator.py`
    - Формировать URL: `https://image.pollinations.ai/prompt/{encoded_prompt}?width=1200&height=630&nologo=true`
    - Скачивать изображения через `requests.get`
    - При ошибке одного изображения — логировать предупреждение и продолжать
    - При ошибке всех изображений — бросать `ImageGenerationError`
    - _Требования: 2.1, 2.2, 2.3, 2.5, 2.6_
  - [x] 3.2 Написать property-тест для количества изображений
    - **Property 2: Количество изображений в диапазоне 1..image_count**
    - **Validates: Requirements 2.2**
    - `# Feature: ai-article-generator, Property 2: image count within valid range`
  - [x] 3.3 Написать unit-тесты для ImageGenerator
    - Тест частичной ошибки (1 из 2 провалился — возвращает 1 изображение)
    - Тест полного отказа (все провалились — бросает ImageGenerationError)
    - _Требования: 2.5, 2.6_

- [x] 4. Контрольная точка — убедиться, что все тесты проходят
  - Убедиться, что все тесты проходят. Если возникнут вопросы — уточнить у пользователя.

- [x] 5. Реализовать WordPressClient
  - [x] 5.1 Реализовать `WordPressClient` в `wordpress_client.py`
    - Метод `upload_media`: multipart POST на `/wp-json/wp/v2/media`, повтор 1 раз при ошибке
    - Метод `create_post`: POST на `/wp-json/wp/v2/posts` с полями `title`, `content`, `excerpt`, `status`, `date`, `featured_media`, `categories`, `tags`
    - Basic Auth через `wp_username:wp_app_password`
    - Бросать `WordPressAuthError` при HTTP 401, `WordPressError` при других ошибках
    - _Требования: 3.1, 3.4, 4.1, 4.2, 4.4, 4.5, 6.3_
  - [x] 5.2 Написать property-тест для featured image
    - **Property 3: Первое изображение становится featured image**
    - **Validates: Requirements 3.3**
    - `# Feature: ai-article-generator, Property 3: first image is featured_media`
  - [x] 5.3 Написать property-тест для статуса публикации
    - **Property 4: Статус publish/future соответствует наличию даты**
    - **Validates: Requirements 5.1, 5.4**
    - `# Feature: ai-article-generator, Property 4: publish status matches publish_at presence`
  - [x] 5.4 Написать unit-тесты для WordPressClient
    - Тест retry при ошибке загрузки медиа (ровно 1 повтор)
    - Тест WordPressAuthError при HTTP 401
    - Тест формирования Basic Auth заголовка
    - _Требования: 3.4, 4.5, 6.3_

- [x] 6. Реализовать валидацию даты и ArticlePipeline
  - [x] 6.1 Реализовать валидацию даты в `validators.py`
    - Функция `validate_publish_at(dt: datetime)` — бросает `ValidationError` если дата в прошлом
    - _Требования: 5.2, 5.3_
  - [x] 6.2 Написать property-тест для валидации даты
    - **Property 5: Дата в прошлом отклоняется**
    - **Validates: Requirements 5.3**
    - `# Feature: ai-article-generator, Property 5: past date raises ValidationError`
  - [x] 6.3 Реализовать `ArticlePipeline` в `pipeline.py`
    - Метод `run(input: PipelineInput) -> PublishResult`
    - Оркестрировать: валидация → TextGenerator → ImageGenerator → WordPressClient.upload_media (для каждого) → WordPressClient.create_post
    - Возвращать `PublishResult` с `post_id`, `post_url`, `status`, `scheduled_at`
    - _Требования: 1.1, 2.1, 3.1, 3.3, 4.1, 4.4, 5.1, 5.4, 5.5_
  - [x] 6.4 Написать property-тест для PublishResult при отложенной публикации
    - **Property (5.5): scheduled_at в PublishResult совпадает с переданным publish_at**
    - **Validates: Requirements 5.5**
    - `# Feature: ai-article-generator, Property: scheduled_at matches input publish_at`

- [x] 7. Реализовать CLI-интерфейс
  - [x] 7.1 Реализовать CLI в `main.py` с использованием `argparse`
    - Обязательный аргумент: `--prompt` (или позиционный)
    - Опциональные: `--publish-at` (ISO 8601), `--category` (int, повторяемый), `--tag` (str, повторяемый), `--image-count` (2 или 3, по умолчанию 2)
    - При успехе: вывести URL и статус в stdout
    - При ошибке: вывести сообщение в stderr, завершить с кодом 1
    - _Требования: 7.1, 7.2, 7.3, 7.4_
  - [x] 7.2 Написать property-тест для парсинга аргументов CLI
    - **Property (7.2): для любой комбинации валидных аргументов PipelineInput содержит корректные значения**
    - **Validates: Requirements 7.2**
    - `# Feature: ai-article-generator, Property: CLI args parse to correct PipelineInput`
  - [x] 7.3 Написать unit-тесты для CLI
    - Тест успешного вывода (URL и статус в stdout)
    - Тест вывода ошибки (stderr непустой, код выхода 1)
    - _Требования: 7.3, 7.4_

- [x] 8. Финальная контрольная точка — убедиться, что все тесты проходят
  - Убедиться, что все тесты проходят. Если возникнут вопросы — уточнить у пользователя.

## Примечания

- Каждая задача ссылается на конкретные требования для трассируемости
- Все HTTP-запросы к внешним API мокируются в тестах
- Реальные API не вызываются в тестах
