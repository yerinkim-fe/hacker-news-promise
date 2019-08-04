document.addEventListener("DOMContentLoaded", function () {
  const $nav = document.querySelector('nav');
  const $more = document.querySelector('.more');
  const $content = document.getElementById('content');
  const base = 'https://news.ycombinator.com/';
  const getArticleUrl = articleID => `https://hacker-news.firebaseio.com/v0/${articleID}.json`;
  const getItemUrl = itemID => `https://hacker-news.firebaseio.com/v0/item/${itemID}.json`;
  const count = {
    start: 0,
    end: 30,
    times: 1
  };
  let listLength = 30;
  let prevTarget;
  let rank = 1;
  let isDone = false;
  const liveData = ['topstories', 'newstories', 'askstories', 'showstories', 'jobstories'];
  const allItemsPromises = [];
  let moreCount = 0;

  const articleDetailPromise = (i) => {
    return new Promise(function (resolve, reject) {
      $.get({
        url: getArticleUrl(liveData[i]),
        success: function (articleData) {
          resolve(articleData);
        }
      });
    });
  };

  function getItems(i) {
    console.log(`i: ${i}`);
    count.times = 0;
    rank = 1;
    $more.style.display = 'none';
    isDone = false;

    articleDetailPromise(i)
      .then(articleData => {
        function iterator(start, end) {
          const list = articleData.slice(start, end);
          let newContent = '';
          let site;
          let commText;

          console.log(articleData);

          $content.innerHTML = '';
          allItemsPromises.length = 0;

          list.forEach(function (itemID, i) {
            const itemDetailPromise = new Promise(function (resolve, reject) {
              $.get({
                url: getItemUrl(itemID),
                success: function (itemData) {
                  resolve(itemData);
                }
              });
            });
            // console.log(`${i + 1}번째 아이템 ${itemID} Promise 생성`);
            allItemsPromises.push(itemDetailPromise);
          });

          // id 30개씩 받아오면 출력
          Promise.all(allItemsPromises)
            .then((itemData) => {
              console.log(itemData);

              itemData.forEach(item => {
                if (`${item.url}` === 'undefined') {
                  site = '';
                } else {
                  let a = document.createElement('a');
                  a.href = `${item.url}`;

                  site = `<span class="sitebit"> (<a href="${base}from?site=${a.hostname}">${a.hostname}</a>)</span>`
                }

                if (`${item.descendants}` === '0') {
                  commText = 'discuss';
                } else {
                  commText = `${item.descendants} comments`;
                }

                newContent += `<li>
                  <span class="count">${rank++}.</span>
                  <span class="title"><a href="${item.url}">${item.title}</a></span>
                  ${site}
                  <div class="subtext">
                    <span class="score">${item.score} points</span>
                    by <a href="${base}user?id=${item.by}">${item.by}</a>
                    <span class="age"><a href="${base}item?id=${item.id}">${item.time} minutes ago</a></span>  |
                    <a href="${base}hide?id=${item.id}&amp;goto=news">hide</a> |
                    <a href="${base}item?id=${item.id}">${commText}</a>
                  </div>
                  </li>`;
              });

              $content.innerHTML += newContent;

            })
            .then(function () {
              count.times++;

              if (isDone) $more.style.display = 'none';
              else $more.style.display = 'block';
              $more.addEventListener('click', function () {
                moreCount++;
                // console.log(`i: ${i}`);
                // console.log(`articleData: ${articleData}`);

                count.start = count.times * listLength;
                // console.log(allArticlePromises);
                console.log(articleData.length);

                if (articleData.length - count.start < 30) {
                  count.end = articleData.length;
                  isDone = !isDone;
                  $more.style.display = 'none';
                } else {
                  count.end = count.start + 30;
                }

                console.log(count.times, count.start, count.end);


                // getMore 반복해야 함 데이터가 없을 때까지
                iterator(count.start, count.end);
              });
            });
        }

        iterator(0, listLength);
      });
  }

  getItems(0);

  $nav.addEventListener('click', ev => {
    ev.preventDefault();

    if (prevTarget) prevTarget.classList.remove('active');
    ev.target.classList.add('active');

    prevTarget = ev.target;

    if (ev.target.id === 'top') {
      getItems(0);
    } else if (ev.target.id === 'newest') {
      getItems(1);
    } else if (ev.target.id === 'ask') {
      getItems(2);
    } else if (ev.target.id === 'show') {
      getItems(3);
    } else if (ev.target.id === 'jobs') {
      getItems(4);
    }
  });
});