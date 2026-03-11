
  # Redesign Mobile Interface

  This is a code bundle for Redesign Mobile Interface. The original project is available at https://www.figma.com/design/yWWOIBOyLo7eTWhMT5eccl/Redesign-Mobile-Interface.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ### Открыть на iPhone (по HTTPS — для датчика наклона)

  1. Подключи iPhone и компьютер к **одной сети Wi‑Fi**.
  2. Запусти сервер: `npm run dev:mobile` или `npm run dev`. В выводе будет ссылка вида **https://192.168.x.x:5173**.
  3. В Safari на iPhone открой эту ссылку. При первом заходе Safari покажет «Подключение не защищено» — нажми **«Подробнее»** → **«Перейти на сайт»** (сертификат самоподписанный, для локалки это нормально).
  4. Если страница не открывается — разреши порт 5173 в брандмауэре Windows.
  