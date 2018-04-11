# yandex_disk_api
Create React App for Yandex Disk API
Простой клиент для Yandex Disk, который позволяет просматривать и загружать файлы из Yandex Disk.
Написан на чистом React 16.3.0 без использования дополнительный библиотек. Все компоненты находятся в одном файле - index.js
Среда разработки устанавливается: npm react-create-app yandexdisk.
Пример работы https://apps-4-you.com/yadisk/

<img src="/screen.png" width="435" alt="yandex disk api">

Принцип работы:
1. Компонент App проверяет наличие токена в hash или в cookie браузера. Если ничего из этого нет, то отображается компонент Token.
2. Компонент Token отправляет пользователя на страницу авторизации Яндекс.OAuth с запросом token для данного приложения.
3. После подтверждения доступа, Яндекс.OAuth возвращает пользователя на страницу приложения, передавая token в адресной строке после символа # (hash). 
4. Компонент App забирает token из строки hash, записывает его в cookie браузера и обновляет страницу.
5. Компонент App обнаруживает записанный к cookie токен, и отображает компонент YandexDisk.
6. Компонент YandexDisk строит дерево файлов Яндекс диска с помощью запросов к API Диска.
