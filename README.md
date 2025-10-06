# 🧩 User Service

Сервис для работы с пользователями. Реализован на **TypeScript + Express + TypeORM + PostgreSQL**.  
Поддерживает регистрацию, авторизацию, получение пользователей, изменение статуса и управление ролями.

---

## 🚀 Стек технологий

| Компонент | Технология |
|------------|-------------|
| Язык | **TypeScript** |
| Сервер | **Express.js** |
| База данных | **PostgreSQL** |
| ORM | **TypeORM** |
| Аутентификация | **JWT (jsonwebtoken)** |
| Валидация | Кастомные middleware |
| Переменные окружения | **dotenv** |
| Логирование запросов | **morgan** |
| Хэширование паролей | **bcryptjs** |

---

## 🧱 Модель пользователя

Таблица `users` содержит следующие поля:

| Поле | Тип | Описание |
|------|-----|-----------|
| `id` | UUID | Уникальный идентификатор |
| `fullName` | string | ФИО пользователя |
| `dateOfBirth` | date | Дата рождения |
| `email` | string (unique) | Email, уникальный |
| `password` | string | Хэш пароля (bcrypt) |
| `role` | enum(`user`, `admin`) | Роль пользователя |
| `isActive` | boolean | Статус активности |
| `createdAt` | date | Дата создания |
| `updatedAt` | date | Дата обновления |

---

### 👤 Эндпоинты

| Метод | Путь | Описание | Доступ |
|--------|------|-----------|---------|
| `POST` | `/api/users/register` | Регистрация нового пользователя | Все |
| `POST` | `/api/users/login` | Авторизация, получение JWT | Все |
| `GET` | `/api/users/:id` | Получение пользователя по ID | Сам или админ |
| `GET` | `/api/users` | Получение списка всех пользователей | Только админ |
| `PATCH` | `/api/users/:id` | Обновление данных пользователя | Сам или админ |
| `PATCH` | `/api/users/:id/block` | Блокировка пользователя | Сам или админ |
| `GET` | `/api/users/profile` | Профиль текущего пользователя | Авторизованный |

---

## 🧩 Middleware

| Middleware | Назначение |
|-------------|------------|
| `auth.middleware.ts` | Проверяет JWT, извлекает пользователя, проверяет роль |
| `validation.middleware.ts` | Проверяет корректность тела запросов (регистрация, логин) |
| `errorHandler.ts` | Централизованный перехват и форматирование ошибок |
| `notFound.ts` | Обработка несуществующих маршрутов (404) |

---

## 🧠 Бизнес-логика (`UserService`)

- Создание пользователя с проверкой уникальности email  
- Хэширование пароля перед сохранением  
- Авторизация и проверка пароля  
- Формирование JWT токена  
- Получение пользователя или списка  
- Обновление профиля / статуса  
- Создание администратора при первом запуске  
- Генерация и сохранение токена администратора в `.admin.jwt`

---

## 🧪 Валидация данных

- Проверка обязательных полей (`fullName`, `email`, `dateOfBirth`, `password`)
- Проверка корректности email и даты
- Минимальная длина пароля — 6 символов

---

## 🔧 Настройки окружения (.env)

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=super_secret_key

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=user_service
```

## Установка и запуск (PowerShell)
```
npm install
npm run dev
```
## 🗄️ Что создаётся в PostgreSQL при первом запуске

После запуска приложения и применения миграций в базе появляются:

### База данных 

- `user_service`

### Таблицы

- **users**
  - `id` UUID (PK)
  - `fullName` varchar(255) NOT NULL
  - `dateOfBirth` date NOT NULL
  - `email` varchar(255) UNIQUE NOT NULL
  - `password` varchar(255) NOT NULL
  - `role` enum(`user`, `admin`) NOT NULL DEFAULT `user`
  - `isActive` boolean NOT NULL DEFAULT `true`
  - `createdAt` timestamp NOT NULL
  - `updatedAt` timestamp NOT NULL

- **migrations**  
  Служебная таблица TypeORM для учёта применённых миграций.

## Тестирование API (bash)

Ниже приведена рекомендованная последовательность проверки функциональности приложения

```bash
# Базовый адрес API и путь к маршрутам пользователей
API_ROOT="http://localhost:3000"
USERS="$API_ROOT/api/users"

# При запуске npm run dev создается файл .admin.jwt — используем его для авторизации как администратора
# Иначе логинимся под админом через API и сохраняем токен в переменную ACCESS_TOKEN
if [ -f .admin.jwt ]; then
    export ACCESS_TOKEN="$(tr -d '\r\n' < .admin.jwt)"
else
    R="$(curl -s -X POST "$USERS/login" \
        -H 'Content-Type: application/json' \
        -d '{"email":"admin@example.com","password":"admin123"}')"
    export ACCESS_TOKEN="$(J="$R" node -e "try{console.log(JSON.parse(process.env.J).token||'')}catch{}")"
fi

# Выводим первые 30 символов токена администратора для проверки
echo "ADMIN_TOKEN=${ACCESS_TOKEN:0:30}..."

# Проверяем, что сервер запущен (эндпоинт health)
curl -s "$API_ROOT/health"
```
```bash
# Отправка POST /register с тестовыми данными
# Затем логинимся, получаем JWT токен (пользователя) и сохраняем его в USER_TOKEN
# Получаем профиль текущего пользователя /profile
# Извлекаем user_id для последующих запросов
EMAIL="test1@example.com"
PASS="pass1234"

curl -s -X POST "$USERS/register" \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Test User","dateOfBirth":"2002-05-10","email":"'"$EMAIL"'","password":"'"$PASS"'"}';

LOGIN_JSON="$(curl -s -X POST "$USERS/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"'"$EMAIL"'","password":"'"$PASS"'"}')"
echo "$LOGIN_JSON"

USER_TOKEN="$(echo "$LOGIN_JSON" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')"
export USER_TOKEN
echo "USER_TOKEN=${USER_TOKEN:0:30}..."

PROFILE_JSON="$(curl -s "$USERS/profile" \
  -H "Authorization: Bearer $USER_TOKEN")"
echo "$PROFILE_JSON"

USER_ID="$(echo "$PROFILE_JSON" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
echo "USER_ID=$USER_ID"
```
Запрашиваем данные пользователя по его ID (GET /users/:id). Авторизация идёт под самим пользователем (USER_TOKEN)
```bash
curl -s "$USERS/$USER_ID" -H "Authorization: Bearer $USER_TOKEN"
```
Запрашиваем того же пользователя, но уже под администратором (ACCESS_TOKEN). Администратор может получать данные любого пользователя
```bash
curl -s "$USERS/$USER_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
```
Получаем список всех пользователей (GET /users). Этот запрос разрешён только администратору
```bash
curl -s "$USERS" -H "Authorization: Bearer $ACCESS_TOKEN"
```
Блокируем пользователя (PATCH /users/:id/block). Операция доступна администратору или пользователю самому себя
```bash
curl -s -X PATCH "$USERS/$USER_ID/block" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

```

