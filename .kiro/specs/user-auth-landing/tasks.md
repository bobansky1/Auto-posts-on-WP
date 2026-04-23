# План реализации: Система авторизации и лендинг

## Обзор

Реализуем систему авторизации (JWT + bcrypt), SQLite-базу данных, публичный лендинг и защищённые маршруты. Работа разбита на инкрементальные шаги: сначала бэкенд (БД → авторизация → история), затем фронтенд (роутинг → страницы → обновление компонентов).

## Задачи

- [x] 1. Настройка базы данных и зависимостей бэкенда
  - Добавить в `web/backend/requirements.txt`: `sqlalchemy`, `passlib[bcrypt]`, `python-jose[cryptography]`, `email-validator`
  - Создать `web/backend/database.py`: SQLAlchemy engine (SQLite), `SessionLocal`, `Base`, функция `get_db`
  - Создать `web/backend/models.py`: ORM-модели `User` и `Publication` согласно дизайну
  - Создать `web/backend/schemas.py`: Pydantic-схемы `RegisterRequest`, `LoginRequest`, `TokenResponse`, `PublicationOut`, `PublicationCreate`
  - Добавить вызов `Base.metadata.create_all(bind=engine)` при старте приложения в `api.py`
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Реализация JWT-утилит и авторизации
  - Создать `web/backend/auth.py`: функции `hash_password`, `verify_password`, `create_access_token`, `decode_access_token`, зависимость `get_current_user`
  - JWT-токен: алгоритм HS256, срок действия 7 дней, секрет из переменной окружения `SECRET_KEY`
  - bcrypt с cost-фактором 12 через `passlib.context.CryptContext`
  - _Requirements: 4.2, 4.3, 4.4, 6.4_

  - [x] 2.1 Написать property-тест: Свойство 7 — срок действия токена 7 дней
    - **Property 7: Срок действия JWT-токена — 7 дней**
    - **Validates: Requirements 4.4**
    - Тег: `Feature: user-auth-landing, Property 7: token expiry 7 days`

  - [x] 2.2 Написать property-тест: Свойство 11 — bcrypt cost ≥ 12
    - **Property 11: Хэш пароля использует bcrypt с cost-фактором ≥ 12**
    - **Validates: Requirements 6.4**
    - Тег: `Feature: user-auth-landing, Property 11: bcrypt cost >= 12`

- [x] 3. Реализация Auth Router
  - Создать `web/backend/routers/auth_router.py` с эндпоинтами:
    - `POST /api/auth/register`: валидация → проверка уникальности email → bcrypt-хэш → INSERT users → вернуть токен
    - `POST /api/auth/login`: найти пользователя → verify_password → вернуть токен
  - Подключить роутер в `api.py` через `app.include_router`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

  - [x] 3.1 Написать property-тест: Свойство 1 — регистрация с валидными данными
    - **Property 1: Регистрация с валидными данными всегда возвращает токен**
    - **Validates: Requirements 2.1**
    - Тег: `Feature: user-auth-landing, Property 1: valid registration returns token`

  - [x] 3.2 Написать property-тест: Свойство 2 — дублирующийся email → 409
    - **Property 2: Дублирующийся email всегда возвращает 409**
    - **Validates: Requirements 2.2**
    - Тег: `Feature: user-auth-landing, Property 2: duplicate email returns 409`

  - [x] 3.3 Написать property-тест: Свойство 3 — короткий пароль → 422
    - **Property 3: Короткий пароль всегда возвращает 422**
    - **Validates: Requirements 2.3**
    - Тег: `Feature: user-auth-landing, Property 3: short password returns 422`

  - [x] 3.4 Написать property-тест: Свойство 4 — невалидные учётные данные → 401
    - **Property 4: Невалидные учётные данные при входе всегда возвращают 401**
    - **Validates: Requirements 3.2, 3.3**
    - Тег: `Feature: user-auth-landing, Property 4: invalid credentials return 401`

  - [x] 3.5 Написать property-тест: Свойство 5 — round-trip авторизации
    - **Property 5: Round-trip авторизации — регистрация → вход → доступ**
    - **Validates: Requirements 3.1, 4.3**
    - Тег: `Feature: user-auth-landing, Property 5: auth roundtrip`

- [x] 4. Реализация History Router
  - Создать `web/backend/routers/history_router.py` с эндпоинтами:
    - `GET /api/history`: вернуть публикации текущего пользователя, отсортированные по `created_at DESC`
    - `POST /api/history`: сохранить новую публикацию для текущего пользователя
    - `DELETE /api/history`: удалить все публикации текущего пользователя
  - Все эндпоинты защищены зависимостью `get_current_user`
  - Обновить `POST /api/generate` в `api.py`: после успешной публикации вызывать сохранение в БД
  - Подключить роутер в `api.py`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 4.1 Написать property-тест: Свойство 6 — невалидный токен → 401
    - **Property 6: Невалидный токен всегда возвращает 401**
    - **Validates: Requirements 4.2**
    - Тег: `Feature: user-auth-landing, Property 6: invalid token returns 401`

  - [x] 4.2 Написать property-тест: Свойство 8 — изоляция истории
    - **Property 8: Изоляция истории публикаций между пользователями**
    - **Validates: Requirements 5.2**
    - Тег: `Feature: user-auth-landing, Property 8: history isolation`

  - [x] 4.3 Написать property-тест: Свойство 9 — удаление не затрагивает других
    - **Property 9: Удаление истории не затрагивает других пользователей**
    - **Validates: Requirements 5.3**
    - Тег: `Feature: user-auth-landing, Property 9: delete history isolation`

  - [x] 4.4 Написать property-тест: Свойство 10 — история отсортирована по дате убывания
    - **Property 10: История отсортирована по дате убывания**
    - **Validates: Requirements 5.4**
    - Тег: `Feature: user-auth-landing, Property 10: history sorted desc`

- [x] 5. Контрольная точка — бэкенд
  - Убедиться, что все тесты бэкенда проходят. Задать вопросы пользователю при необходимости.

- [x] 6. Настройка React Router и структуры фронтенда
  - Установить `react-router-dom` и `@types/react-router-dom` в `web/frontend`
  - Создать `web/frontend/src/auth.ts`: утилиты `getToken`, `setToken`, `removeToken`, `isAuthenticated`
  - Обновить `web/frontend/src/types.ts`: добавить `LoginRequest`, `RegisterRequest`, `TokenResponse`, `PublicationRecord`
  - Обновить `web/frontend/src/api.ts`: добавить функции `login`, `register`, `fetchHistory`, `addHistoryEntry`, `clearHistory`
  - Создать `web/frontend/src/components/PrivateRoute.tsx`: редирект на `/login` при отсутствии токена
  - _Requirements: 4.1_

- [x] 7. Реализация страниц лендинга, входа и регистрации
  - Создать `web/frontend/src/pages/LandingPage.tsx`: шапка с логотипом, hero-секция, кнопки «Войти» и «Зарегистрироваться»; редирект на `/dashboard` если авторизован
  - Создать `web/frontend/src/pages/LoginPage.tsx`: форма с полями email и пароль, обработка ошибок, редирект на `/dashboard` после успеха
  - Создать `web/frontend/src/pages/RegisterPage.tsx`: форма с полями email и пароль, обработка ошибок, редирект на `/dashboard` после успеха
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.5, 3.4_

- [x] 8. Обновление App.tsx и компонентов панели управления
  - Обновить `web/frontend/src/App.tsx`: обернуть в `BrowserRouter`, добавить маршруты `/`, `/login`, `/register`, `/dashboard` (защищён `PrivateRoute`)
  - Обновить `web/frontend/src/components/Sidebar.tsx`: добавить кнопку «Выйти» (вызывает `removeToken`, редирект на `/`)
  - Обновить `web/frontend/src/components/HistoryTab.tsx`: загружать историю через `GET /api/history` вместо `localStorage`
  - Обновить `web/frontend/src/components/ArticleForm.tsx`: после успешной публикации вызывать `POST /api/history` (или бэкенд делает это сам — согласно дизайну)
  - _Requirements: 1.4, 3.5, 5.1, 5.2_

- [x] 9. Контрольная точка — финальная
  - Убедиться, что все тесты проходят. Задать вопросы пользователю при необходимости.

## Примечания

- Все задачи обязательны, включая property-тесты
- Каждая задача ссылается на конкретные требования для трассируемости
- Property-тесты используют Hypothesis (уже применяется в проекте)
- Минимум 100 итераций на каждый property-тест (`@settings(max_examples=100)`)
