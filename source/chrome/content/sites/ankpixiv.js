
try {

  let self = {

    /********************************************************************************
    * 定数
    ********************************************************************************/

    URL:        'http://www.pixiv.net/',
    DOMAIN:     'www.pixiv.net',
    SERVICE_ID: 'PXV',
    SITE_NAME:  'Pixiv',

    ID_FANTASY_DISPLAY: 'ankpixiv-fantasy-display',

    /********************************************************************************
    * プロパティ
    ********************************************************************************/

    in: { // {{{
      get site () { // {{{
        try {
          return self.elements.doc.location.hostname === 'www.pixiv.net';
        } catch (e) {
          return false;
        }
      }, // }}}

      get manga () { // {{{
        let node = self.elements.illust.largeLink;
        return node && node.href.match(/(?:&|\?)mode=manga(?:&|$)/);
      }, // }}}

      get medium () { // {{{
        let loc = AnkBase.currentLocation;
        return (
          self.in.site &&
          loc.match(/member_illust\.php\?/) &&
          loc.match(/(?:&|\?)mode=medium(?:&|$)/) &&
          loc.match(/(?:&|\?)illust_id=\d+(?:&|$)/)
        );
      }, // }}}

      get illustPage () // {{{
        AnkBase.currentLocation.match(/\.pixiv\.net\/member_illust.php\?.*illust_id=/), // }}}

      get myPage () // {{{
        (AnkBase.currentLocation == 'http://www.pixiv.net/mypage.php'), // }}}

      get myIllust () // {{{
        !self.elements.illust.avatar, // }}}

      /*
       * 以下はモジュールローカル部品
       */

      //
      get pixiv () // {{{
        self.in.site, // }}}

      // elementsを使っているが確定後にしか使わないのでOK
      get feed () // {{{
        self.elements.illust.feedList, // }}}

      get illustList () // {{{
        AnkBase.currentLocation.match(/\.pixiv\.net\/member_illust.php\?id=/), // }}}

      get bookmarkNew () // {{{
        AnkBase.currentLocation.match(/\.pixiv\.net\/bookmark_new_illust\.php/), // }}}

      get bookmarkAdd () // {{{
        AnkBase.currentLocation.match(/\.pixiv\.net\/bookmark_add\.php\?/), // }}}
    }, // }}}

    elements: (function () { // {{{
      function query (q)
        self.elements.doc.querySelector(q);

      function queryAll (q)
        self.elements.doc.querySelectorAll(q);

      let illust =  {
        get mediumImage () {
          return (
            query('.works_display > a > img')
            ||
            query('.works_display > * > a > img')
          );
        },

        get largeLink () {
          return (
            query('.works_display > a')
            ||
            query('.works_display > * > a')
          );
        },

        get worksData ()
          query('.work-info'),

        get title ()
          query('.work-info > .title'),

        get comment ()
          query('.work-info > .caption'),

        get avatar ()
          query('.profile-unit > a > img.user-image'),

        get userName ()
          query('.profile-unit > a > .user'),

        get memberLink ()
          query('a.avatar_m'),

        get tags ()
          query('.tags'),

        get recommendList()
          AnkUtils.A(queryAll('.image-items')).pop(),

        get feedList()
          query('#stacc_timeline'),

        get downloadedDisplayParent ()
          query('.work-info'),

        get ads () {
          let obj = AnkUtils.A(queryAll('object'));
          let iframe = AnkUtils.A(queryAll('iframe'));
          let search = AnkUtils.A(queryAll('.ui-search'));
          // 検索欄も広告扱いしちゃうぞ
          let findbox = AnkUtils.A(queryAll('form.search2'));
          // ldrize
          let ldrize = AnkUtils.A(queryAll('#gm_ldrize'));
          // ヘッダ
          let header1 = AnkUtils.A(queryAll('#global-header'));
          let header2 = AnkUtils.A(queryAll('.header'));

          let toolbarItems = AnkUtils.A(queryAll('#toolbar-items'));

          return ([]).concat(obj, iframe, search, findbox, ldrize, header1, header2, toolbarItems);
        }
      };

      let mypage = {
        get fantasyDisplay ()
          query('#' + self.ID_FANTASY_DISPLAY),

        get fantasyDisplayNext ()
          query('#contents > div > div.area_pixivmobile'),
      };

      return {
        illust: illust,
        mypage: mypage,
        get doc () window.content.document
      };
    })(), // }}}

    info: (function () { // {{{
      let illust = {
        get id ()
          parseInt(self.elements.doc.querySelector('#rpc_i_id').textContent, 10),

        get dateTime ()
          self.info.illust.worksData.dateTime,

        get size ()
          self.info.illust.worksData.size,

        get tags () {
          let elem = self.elements.illust.tags;
          if (!elem)
            return [];
          return AnkUtils.A(elem.querySelectorAll('.tag > .text'))
                  .map(function (e) AnkUtils.trim(e.textContent))
                  .filter(function (s) s && s.length);
        },

        get shortTags () {
          let limit = AnkBase.Prefs.get('shortTagsMaxLength', 8);
          return self.info.illust.tags.filter(function (it) (it.length <= limit));
        },

        get tools ()
          self.info.illust.worksData.tools,

        get width ()
          let (sz = illust.size) (sz && sz.width),

        get height ()
          let (sz = illust.size) (sz && sz.height),

        get server ()
          self.info.path.largeStandardImage.match(/^http:\/\/([^\/\.]+)\./i)[1],

        get referer () {
          let mode =
            !self.in.manga                                    ? 'big' :
            !AnkBase.Prefs.get('downloadOriginalSize', false) ? 'manga' :
                                                                'manga_big&page=0'; // @see downloadFiles#downloadNext()

          return AnkBase.currentLocation.replace(/mode=medium/, 'mode='+mode);
        },

        get title ()
          AnkUtils.trim(self.elements.illust.title.textContent),

        get comment ()
          let (e = self.elements.illust.comment)
            (e ? AnkUtils.textContent(e) : ''),

        get R18 ()
          self.info.illust.tags.some(function (v) 'R-18' == v),

        get mangaPages ()
          self.info.illust.worksData.mangaPages,

        get worksData () {
          let zp = AnkUtils.zeroPad;
          let items = AnkUtils.A(self.elements.illust.worksData.querySelectorAll('.meta > li'));
          let result = {};
          items.forEach(function (item) {
            item = item.textContent.replace(/\[ \u30DE\u30A4\u30D4\u30AF\u9650\u5B9A \]/, '').trim();
            let m;
            if (m = item.match(/(\d+)\/(\d+)\/(\d{4})[^\d]+(\d+):(\d+)/)) {
              result.dateTime = {
                year: zp(m[3], 4),
                month: zp(m[1], 2),
                day: zp(m[2], 2),
                hour: zp(m[4], 2),
                minute: zp(m[5], 2),
              };
            } else if (m = item.match(/(\d+)[^\d]+(\d+)[^\d]+(\d+)[^\d]+(\d+):(\d+)/)) {
              result.dateTime = {
                year: zp(m[1], 4),
                month: zp(m[2], 2),
                day: zp(m[3], 2),
                hour: zp(m[4], 2),
                minute: zp(m[5], 2),
              };
            } else if (m = item.match(/\u6F2B\u753B\s*(\d+)P/)) {
              result.mangaPages = parseInt(m[1], 10);
            } else if (m = item.match(/(\d+)\xD7(\d+)/)) {
              result.size = {
                width: parseInt(m[1], 10),
                height: parseInt(m[2], 10),
              };
            } else {
              result.tools = item;
            }
          });
          return result;
        }
      };

      'year month day hour minute'.split(/\s+/).forEach(function (name) {
        illust.__defineGetter__(name, function () illust.dateTime[name]);
      });

      let member = {
        get id ()
          AnkUtils.A(self.elements.doc.querySelectorAll('script'))
            .map(function(it) it.textContent.match(/pixiv.context.userId = '(\d+)';/))
            .filter(function(it) it)[0][1],

        get pixivId ()
          (self.elements.illust.avatar.src.match(/\/profile\/([^\/]+)\//)
           ||
           self.info.path.largeImage.match(/^https?:\/\/[^\.]+\.pixiv\.net\/(?:img\d+\/)?img\/([^\/]+)\//))[1],

        get name ()
          AnkUtils.trim(self.elements.illust.userName.textContent),

        get memoizedName ()
          AnkBase.memoizedName(member.id, self.SERVICE_ID),
      };

      let path = {
        get initDir ()
          AnkBase.Prefs.get('initialDirectory.'+self.SITE_NAME),

        get ext ()
          (self.info.path.largeStandardImage.match(/(\.\w+)(?:$|\?)/)[1] || '.jpg'),

        get mangaIndexPage ()
          AnkBase.currentLocation.replace(/(\?|&)mode=medium(&|$)/, "$1mode=manga$2"),

        // XXX 再投稿された、イラストのパスの末尾には、"?28737478..." のように数値がつく模様
        // 数値を除去してしまうと、再投稿前の画像が保存されてしまう。
        get largeStandardImage ()
          self.elements.illust.mediumImage.src.replace(/_m\./, '.'),

        get image ()
          self.getImageInfo(true),
      };

      return {
        illust: illust,
        member: member,
        path: path
      };
    })(), // }}}

    get downloadable ()
      true,

    getImageInfo: function (b) {
      if (!self.in.manga)
        return { images: [self.info.path.largeStandardImage], facing: null, };

      return self.getMangaPages(b);
    },

    /********************************************************************************
    * ダウンロード＆ファイル関連
    ********************************************************************************/

    /*
     * 遅延インストールのためにクロージャに doc などを保存しておく
     */
    installMediumPageFunctions: function () { // {{{
      function delay (msg, e) { // {{{
        if (installTryed == 20) {
          AnkUtils.dump(msg);
          if (e)
            AnkUtils.dumpError(e, AnkBase.Prefs.get('showErrorDialog'));
        }
        if (installTryed > 100)
          return;
        setTimeout(installer, installInterval);
        installTryed++;
        AnkUtils.dump('tried: ' + installTryed);
      } // }}}

      function noMoreEvent (func) { // {{{
        return function (e) {
          e.preventDefault();
          e.stopPropagation();
          return func.apply(this, arguments);
        };
      } // }}}

      // closure {{{
      let ut = AnkUtils;
      let installInterval = 500;
      let installTryed = 0;
      let con = content;
      let doc = self.elements.doc;
      let win = window.content.window;
      let images = undefined;
      let currentMangaPage = 0;
      // }}}

      let installer = function () { // {{{
        try {
          // インストールに必用な各種要素
          try { // {{{
            var body = doc.getElementsByTagName('body')[0];
            var wrapper = doc.getElementById('wrapper');
            var medImg = self.elements.illust.mediumImage;
            var openComment = doc.querySelector('.comment-show-button');
            var worksData = self.elements.illust.worksData;
            var bgImage = doc.defaultView.getComputedStyle(doc.body, '').backgroundImage;
            var fitMode = AnkBase.Prefs.get('largeImageSize', AnkBase.FIT.NONE);
          } catch (e) {
            return delay("delay installation by error", e);
          } // }}}

          // 完全に読み込まれて以内っぽいときは、遅延する
          if (!(body && medImg && wrapper && openComment && worksData)) // {{{
            return delay("delay installation by null");
          // }}}

          // 中画像クリック時に保存する
          if (AnkBase.Prefs.get('downloadWhenClickMiddle')) { // {{{
            medImg.addEventListener(
              'click',
              function (e) {
                AnkBase.downloadCurrentImageAuto();
              },
              true
            );
          } // }}}

          // 大画像関係
          if (AnkBase.Prefs.get('largeOnMiddle', true)) { // {{{
            let IDPrefix =
              function (id)
                ('ank-pixiv-large-viewer-' + id);

            let createElement =
              function (tagName, id)
                let (elem = doc.createElement(tagName))
                  (id && elem.setAttribute('id', IDPrefix(id)), elem);

            let viewer = createElement('div', 'panel');
            let bigImg = createElement('img', 'image');
            let imgPanel = createElement('div', 'image-panel');
            let buttonPanel = createElement('div', 'button-panel');
            let prevButton = createElement('button', 'previous-button');
            let nextButton = createElement('button', 'next-button');
            let resizeButton = createElement('button', 'resize-button');
            let closeButton = createElement('button', 'close-button');
            let pageSelector = createElement('select', 'page-selector');

            let updateButtons = function (v) (pageSelector.value = currentMangaPage);

            viewer.setAttribute('style', 'top: 0px; left: 0px; width:100%; height: 100%; text-align: center; display: none; -moz-opacity: 1; padding: 0px; bottom: 0px');
            prevButton.innerHTML = '<<';
            nextButton.innerHTML = '>>';
            resizeButton.innerHTML = 'RESIZE';
            closeButton.innerHTML = '\xD7';
            buttonPanel.setAttribute('style', 'position: fixed !important; bottom: 0px; width: 100%; opacity: 0; z-index: 666');
            bigImg.setAttribute('style', 'margin: 0px; background: #FFFFFF');
            imgPanel.setAttribute('style', 'margin: 0px');

            [prevButton, nextButton, resizeButton, closeButton].forEach(function (button) {
              button.setAttribute('class', 'submit_btn');
              button.setAttribute('style', 'width: 100px !important');
            });

            if (MutationObserver) {
              // 画像ロード中は半透明にする
              new MutationObserver(function (o) {
                o.forEach(function (e) {
                  e.target.style.setProperty('opacity', '0.5', 'important');
                });
              }).observe(bigImg, {attributes: true, attributeFilter: ['src']});

              // 画像ロード完了後に半透明を解除
              bigImg.addEventListener('load', function (e) {
                e.target.style.setProperty('opacity', '1', 'important');
              }, false);
            }

            /*
             * viewer
             *    - imgPanel
             *      - bigImg
             *    - buttonPanel
             *      - prevButton
             *      - pageSelector
             *      - nextButton
             *      - resizeButton
             *      - closeButton
             */
            viewer.appendChild(imgPanel);
            imgPanel.appendChild(bigImg);
            if (self.in.manga) {
              viewer.appendChild(buttonPanel);
              buttonPanel.appendChild(pageSelector);
              buttonPanel.appendChild(prevButton);
              buttonPanel.appendChild(nextButton);
              buttonPanel.appendChild(resizeButton);
              buttonPanel.appendChild(closeButton);
            }
            else {
              viewer.appendChild(buttonPanel);
              buttonPanel.appendChild(resizeButton);
              buttonPanel.appendChild(closeButton);
            }
            body.insertBefore(viewer, body.firstChild);

            let bigMode = false;

            let fadeOutTimer
            let showButtons = function () {
              if (fadeOutTimer)
                clearInterval(fadeOutTimer);
              buttonPanel.style.opacity = 1;
            };
            let hideButtons = function () {
              function clearFadeOutTimer () {
                clearInterval(fadeOutTimer);
                fadeOutTimer = void 0;
                buttonOpacity = 0;
              }

              if (AnkBase.Prefs.get('dontHidePanel', false))
                return;

              let buttonOpacity = 100;
              fadeOutTimer = setInterval(function () {
                try {
                  if (buttonOpacity <= 0)
                    return clearFadeOutTimer();
                  buttonOpacity -= 10;
                  buttonPanel.style.opacity = buttonOpacity / 100.0;
                } catch (e if e instanceof TypeError) {
                  // XXX for "can't access dead object"
                  clearFadeOutTimer();
                }
              }, 100);
            };

            let loadBigImage = function (bigImgPath) {
              bigImg.style.display = 'none';
              bigImg.setAttribute('src', bigImgPath);
            };

            let autoResize = function () {
              function resize (w, h) {
                bigImg.style.width = w + 'px';
                bigImg.style.height = h + 'px';
                if (ch > h) {
                  bigImg.style.marginTop = parseInt(ch / 2 - h / 2) + 'px';
                } else {
                  bigImg.style.marginTop = '0px';
                }
              }

              let cw = doc.documentElement.clientWidth, ch = doc.documentElement.clientHeight;
              let iw = bigImg.naturalWidth, ih = bigImg.naturalHeight;
              let pw = cw / iw, ph = ch / ih;
              if (AnkBase.Prefs.get('dontResizeIfSmall')) {
                pw = pw>1 ? 1 : pw;
                ph = ph>1 ? 1 : ph;
              }
              let pp = Math.min(pw, ph);

              switch (fitMode) {
              case AnkBase.FIT.IN_WINDOW_SIZE:
                resize(parseInt(iw * pp), parseInt(ih * pp));
                resizeButton.innerHTML = 'FIT in Window';
                break;
              case AnkBase.FIT.IN_WINDOW_WIDTH:
                resize(parseInt(iw * pw), parseInt(ih * pw));
                resizeButton.innerHTML = 'FIT in Width';
                break;
              case AnkBase.FIT.IN_WINDOW_HEIGHT:
                resize(parseInt(iw * ph), parseInt(ih * ph));
                resizeButton.innerHTML = 'FIT in Height';
                break;
              default:
                resize(iw, ih);
                resizeButton.innerHTML = 'No FIT';
                break;
              }

              bigImg.style.display = '';
              window.content.scrollTo(0, 0);
            };

            bigImg.addEventListener('load', autoResize, true);

            let qresize = null;
            let delayResize = function () {
              if (!bigMode)
                return;
              if (qresize)
                clearTimeout(qresize);
              qresize = setTimeout(function(e) {
                qresize = null;
                autoResize();
              },200)
            };

            win.addEventListener('resize', delayResize, false);

            let changeImageSize = function () {
              let ads = self.elements.illust.ads;
              let wrapperTopMargin;

              if (bigMode) {
                doc.querySelector('html').style.overflowX = '';
                doc.querySelector('html').style.overflowY = '';

                body.style.backgroundImage = bgImage;
                viewer.style.display = 'none';
                wrapper.setAttribute('style', 'opacity: 1;');
                if (wrapperTopMargin)
                  wrapper.style.marginTop = wrapperTopMargin;
                ads.forEach(function (ad) (ad.style.display = ad.__ank_pixiv__style_display));
              } else {
                if (typeof images === 'undefined' || images.length == 0) {
                  images = self.getImageInfo(false).images;
                  if (images.length == 0)
                    return; // server error.
                }

                hideButtons();
                currentMangaPage = 0;

                if (self.in.manga) {
                  for (let i = 0; i < images.length; i++) {
                    let option = doc.createElement('option');
                    option.textContent = (i + 1) + '/' + images.length;
                    option.value = i;
                    pageSelector.appendChild(option);
                  }
                }

                body.style.backgroundImage = 'none';
                loadBigImage(images[0]);
                viewer.style.display = '';
                wrapper.setAttribute('style', 'opacity: 0.1;');
                wrapperTopMargin = wrapper.style.marginTop;
                wrapper.style.marginTop = '0px';
                bigImg.style.setProperty('opacity', '1', 'important');
                ads.forEach(
                  function (ad) {
                    ad.__ank_pixiv__style_display = ad.style.display;
                    ad.style.display = 'none';
                  }
                );
                updateButtons();
              }
              bigMode = !bigMode;
            };

            let (reloadLimit = 10, reloadInterval = 1000, prevTimeout) {
              bigImg.addEventListener('error',
                function () {
                  if (bigImg instanceof Ci.nsIImageLoadingContent && bigImg.currentURI) {
                    let req = bigImg.getRequest(Ci.nsIImageLoadingContent.CURRENT_REQUEST);
                    AnkUtils.dump('self: imageStatus = ' + req.imageStatus.toString(2));
                    if (confirm(AnkBase.Locale('confirmForReloadBigImage'))) {
                      bigImg.forceReload();
                      return;
                    }
                  }
                  changeImageSize();
                },
                true
              );
            }

            let goPage = function (num) {
              currentMangaPage = num;
              if ((num >= images.length) || (num < 0))
                return changeImageSize();
              updateButtons();
              AnkUtils.dump('goto ' + num + ' page');
              bigImg.setAttribute('src', images[num]);
            };

            let goNextPage = function (d, doLoop) {
              if (bigMode) {
                let page = currentMangaPage + (d || 1);
                goPage(
                  !doLoop               ? page :
                  page >= images.length ? 0 :
                  page < 0              ? images.length :
                                          page
                );
              } else {
                changeImageSize();
              }
            };

            doc.changeImageSize = changeImageSize;
            doc.goNextMangaPage = goNextPage;

            buttonPanel.addEventListener('mouseover', showButtons, false);
            buttonPanel.addEventListener('mouseout', hideButtons, false);
            prevButton.addEventListener('click', noMoreEvent(function () goNextPage(-1, true)), false);
            nextButton.addEventListener('click', noMoreEvent(function () goNextPage(1, true)), false);
            resizeButton.addEventListener(
              'click',
              noMoreEvent(function() {
                function rotateFitMode (fit) {
                  switch (fit) {
                  case AnkBase.FIT.IN_WINDOW_SIZE:
                    return AnkBase.FIT.IN_WINDOW_HEIGHT;
                  case AnkBase.FIT.IN_WINDOW_HEIGHT:
                    return AnkBase.FIT.IN_WINDOW_WIDTH;
                  case AnkBase.FIT.IN_WINDOW_WIDTH:
                    return AnkBase.FIT.IN_WINDOW_NONE;
                  default:
                    return AnkBase.FIT.IN_WINDOW_SIZE;
                  }
                }

                fitMode = rotateFitMode(fitMode);
                autoResize();
              }),
              false
            );
            closeButton.addEventListener('click', noMoreEvent(changeImageSize), false);
            bigImg.addEventListener(
              'click',
              noMoreEvent(function (e) {
                if (self.in.manga && (currentMangaPage < images.length))
                  goNextPage(1, false)
                else
                  changeImageSize();
              }),
              false
            );
            medImg.addEventListener(
              'click',
              function (e) {
                if (AnkBase.Prefs.get('dontHidePanel', false))
                  showButtons();
                noMoreEvent(changeImageSize)(e);
              },
              false
            );
            pageSelector.addEventListener(
              'change',
              noMoreEvent(function () goPage(parseInt(pageSelector.value, 10))),
              true
            );
            pageSelector.addEventListener('click', noMoreEvent(function () void 0), false);
            doc.addEventListener(
              'click',
              function (e) {
                if (e.button === 0 && bigMode && e.target !== openComment)
                  noMoreEvent(changeImageSize)(e);
              },
              false
            );
          } // }}}

          // レイティングによるダウンロード
          (function () { // {{{
            if (!AnkBase.Prefs.get('downloadWhenRate', false))
              return;
            let point = AnkBase.Prefs.get('downloadRate', 10);
            AnkUtils.A(doc.querySelectorAll('.rating')).forEach(function (e) {
              e.addEventListener(
                'click',
                function () {
                  let klass = e.getAttribute('class', '');
                  let m = klass.match(/rate-(\d+)/);
                  if (m && (point <= parseInt(m[1], 10)))
                    AnkBase.downloadCurrentImageAuto();
                },
                true
              );
            });
          })(); // }}}

          // 保存済み表示
          if (AnkBase.isDownloaded(self.info.illust.id,self.SERVICE_ID)) { // {{{
            AnkBase.insertDownloadedDisplay(
                self.elements.illust.downloadedDisplayParent,
                self.info.illust.R18
            );
          } // }}}

          // コメント欄を開く
          if (AnkBase.Prefs.get('openComment', false)) // {{{
            setTimeout(function () openComment.click(), 1000);
          // }}}

          AnkUtils.dump('installed: '+self.SITE_NAME);

        } catch (e) {
          AnkUtils.dumpError(e);
        }
      }; // }}}

      return installer();
    }, // }}}

    /*
     * リストページ用ファンクション
     */
    installListPageFunctions: function () { /// {

      // 伸びるおすすめリストに追随する
      function followExpansion () {
        let recommend = self.elements.illust.recommendList;
        let feed = self.elements.illust.feedList;

        let installTimer = setInterval(
          function () {
            if (!AnkBase.Prefs.get('markDownloaded', false))
              return;

            let elm = recommend || feed;
            if (!elm && counter > 0) {
              AnkUtils.dump('delay fe: '+self.SITE_NAME+', '+counter--);
              return;
            }
  
            clearInterval(installTimer);
            installTimer = null;

            if (!elm) {
              AnkUtils.dump('installation failed fe: '+self.SITE_NAME);
              return;
            }

            if (MutationObserver) {
              new MutationObserver(function (o) {
                o.forEach(function (e) self.markDownloaded(e.target, true));
              }).observe(elm, {childList: true});
            }
  
            AnkUtils.dump('installed fe: '+self.SITE_NAME);
          },
          interval
        );
      }

      // プレミアムユーザーでない絵師さんの作品一覧は遅延が発生するのでonFocusによる処理だけではマークがつかない
      function delayMarking () {
        let doc = self.elements.doc;

        let installTimer = setInterval(
            function () {
              if (typeof doc === 'undefined' || !doc || doc.readyState !== "complete") {
                if (counter > 0) {
                  AnkUtils.dump('delay dm: '+counter--);
                  return;
                }
              }

              clearInterval(installTimer);
              installTimer = null;

              if (typeof doc === 'undefined' || !doc ) {
                AnkUtils.dump('installation failed dm: '+self.SITE_NAME);
                return;
              }

              self.markDownloaded(doc,true);

              AnkUtils.dump('installed dm: '+self.SITE_NAME);
            },
            interval
          );
      }

      let counter = 20;
      let interval = 500;

      if (!(self.in.illustList || self.in.bookmarkNew || self.in.bookmarkAdd))
        followExpansion();

      delayMarking();
    },

    /*
     * ダウンロード済みイラストにマーカーを付ける
     *    node:     対象のノード (AutoPagerize などで追加されたノードのみに追加するためにあるよ)
     *    force:    追加済みであっても、強制的にマークする
     */
    markDownloaded: function (node, force, ignorePref) { // {{{
      const IsIllust = /&illust_id=(\d+)/;
      const BoxTag = /^(li|div|article)$/i;

      function findBox (e, limit, cls) {
        if (limit <= 0)
          return null;
        if (BoxTag.test(e.tagName)) {
          if (!cls && self.in.feed)
            cls = 'stacc_ref_thumb_left';
          if (!cls || e.className.split(/ /).some(function (v) (v === cls)))
            return e;
        }
        return findBox(e.parentNode, limit - 1, cls);
      }

      if (self.in.medium || !self.in.site)
        return;

      if (!AnkBase.Prefs.get('markDownloaded', false) && !ignorePref)
        return;

      if (!force && AnkBase.Store.document.marked)
        return;

      AnkBase.Store.document.marked = true;

      if (!node)
        node = self.elements.doc;

      [
        ['a > img', 1],
        ['a > p > img', 2],
        ['a > div > img', 2],
        ['a > p > div > img', 3]
      ].forEach(function ([selector, nTrackback]) {
        AnkUtils.A(node.querySelectorAll(selector)) .
          map(function (img) AnkUtils.trackbackParentNode(img, nTrackback)) .
          map(function (link) link.href && let (m = IsIllust.exec(link.href)) m && [link, m]) .
          filter(function (m) m) .
          map(function ([link, m]) [link, parseInt(m[1], 10)]) .
          forEach(function ([link, id]) {
            let box = findBox(link, 3);
            if (box && !box.className.split(/ /).some(function (v) v === AnkBase.CLASS_NAME.DOWNLOADED)) {
              if (AnkBase.isDownloaded(id,self.SERVICE_ID))
                box.className += ' ' + AnkBase.CLASS_NAME.DOWNLOADED;
            }
          });
      });
    }, // }}}


    /********************************************************************************
     * その他
     ********************************************************************************/

    /*
     * 評価する
     */
    rate: function (pt) { // {{{
      if (!(self.in.pixiv && self.in.medium))
        throw 'not in pixiv';
      if (pt < 1 || 10 < pt)
        throw 'out of range';
      let rating = window.content.window.wrappedJSObject.pixiv.rating;
      if (typeof rating.rate === 'number') {
        rating.rate = pt;
        rating.apply.call(rating, {});
        if (!AnkBase.Prefs.get('downloadWhenRate', false))
          return true;
        let point = AnkBase.Prefs.get('downloadRate', 10);
        if (point <= pt)
          AnkBase.downloadCurrentImage(undefined, AnkBase.Prefs.get('confirmExistingDownloadWhenAuto'));
      } else {
        return false;
      }

      return true;
    }, // }}}


    /********************************************************************************
    * Pixiv固有
    ********************************************************************************/

    replaceMangaImageUrl: function  (v) {
      return (v.match(/_big_p\d+\./) ? v : v.replace(/_p(\d+)\./, '_big_p$1.'));
    },

    /*
     * マンガのページ一覧を取得する。
     *
     *  return
     *    .images:     画像のurlリスト
     *    .facing:     見開きがある場合はurlに対応するページ番号のリスト、それ以外の場合はnull
     */
    getMangaPages: function (originalSizeCheck) { // {{{

      const MAX = 1000;

      const NULL_RET = { images: [], facing: null, };

      let doc = AnkUtils.createHTMLDocument(AnkUtils.httpGET(self.info.path.mangaIndexPage));
      if (doc.querySelector('.errorArea') || doc.querySelector('.errortxt')) {
        window.alert(AnkBase.Locale('serverError'));
        return NULL_RET;
      }

      let im = [];
      let fp = [];
      AnkUtils.A(doc.querySelector('.manga').querySelectorAll('script')).
        some(function (v) {
          if (v.textContent.match(/pixiv\.context\.images\[\d+\]\s*=\s*'(.+?)'/)) {
            if (im.length > MAX)
              return true;
            im.push(RegExp.$1);
          } else if (v.textContent.match(/pixiv\.context\.pages\[(\d+)\]/)) {
            fp.push(1 + parseInt(RegExp.$1));
          }
        });

      if (im.length == 0) {
        window.alert(AnkBase.Locale('serverError'));
        return NULL_RET;
      }

      if (fp.length > 0 && fp[fp.length - 1] < fp.length) {
        // 見開きがある場合
        AnkUtils.dump("Facing Page Check: " + fp.length + " pics in " + fp[fp.length - 1] + " pages");
      }
      else {
        // 見開きがない場合
        fp = null;
      }

      if (originalSizeCheck && AnkBase.Prefs.get('downloadOriginalSize', false)) {
        let bigi = self.replaceMangaImageUrl(im[0]);
        if (bigi) {
          const cookieManager = Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager2);
          cookieManager.add(
            '.pixiv.net',
            '/',
            'pixiv_embed',
            'pix',
            false,
            false,
            false,
            new Date().getTime() + (1000 * 60 * 60 * 24 * 365)
          );
  
          if (AnkUtils.remoteFileExists(bigi))
            im = im.map(function (v) self.replaceMangaImageUrl(v));
        }
      }

      return { images: im, facing: fp, };
    }, // }}}
  };

  /********************************************************************************
  * インストール - ankpixiv.xulにも登録を
  ********************************************************************************/

  AnkBase.addModule(self);

} catch (error) {
 dump("[" + error.name + "]\n" +
      "  message: " + error.message + "\n" +
      "  filename: " + error.fileName + "\n" +
      "  linenumber: " + error.lineNumber + "\n" +
      "  stack: " + error.stack + "\n");
}