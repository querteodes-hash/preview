Object.defineProperty(window.localStorage, "setItem", {
  value: function (key, value) {
    if (key === "isDarkMode") value = "true";
    Storage.prototype.setItem.call(this, key, value);
  }
});
$('.lineList').slick({
  infinite: true,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  arrows: false,
  dots: false,
  variableWidth: true,
  centerMode: false,
  autoplaySpeed: 0,
  speed: 6000,
  cssEase: 'linear',
  rows: 0,  
  append: $('.lineList').clone().addClass('slick-cloned')
});

$('.partners-talk-list').slick({
  infinite: false,
  slidesToShow: 4,
  slidesToScroll: 1,
  centerMode: false,
  autoplay: true,
  autoplaySpeed: 3000,
  arrows: true,
  dots: false,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3
      }
    },
    {
      breakpoint: 860,
      settings: {
        slidesToShow: 2
      }
    },
    {
      breakpoint: 640,
      settings: {
        slidesToShow: 1
      }
    }
  ]
});

$('.review-top').slick({
  infinite: false,
  slidesToShow: 4,
  slidesToScroll: 1,
  centerMode: false,
  autoplay: true,
  autoplaySpeed: 3000,
  arrows: false,
  dots: false,
  responsive: [
    {
      breakpoint: 1160,
      settings: {
        slidesToShow: 3
      }
    },
    {
      breakpoint: 860,
      settings: {
        slidesToShow: 2
      }
    },
    {
      breakpoint: 640,
      settings: {
        slidesToShow: 1
      }
    }
  ]
});

$('.review-bottom').slick({
  infinite: false,
  slidesToShow: 3.5,
  slidesToScroll: 1,
  centerMode: false,
  autoplay: true,
  autoplaySpeed: 3000,
  arrows: false,
  dots: false,
  responsive: [
    {
      breakpoint: 1160,
      settings: {
        slidesToShow: 2.5
      }
    },
    {
      breakpoint: 860,
      settings: {
        slidesToShow: 1.5
      }
    }
  ]
});

function initDevTabs() {
  $(document).on('click', '.dev-tab-list li', function () {
    const index = $(this).index() + 1;  
    const title = $(this).find('.tab-title').text().trim();
 
    $('.dev-tab-list li').removeClass('select');
    $(this).addClass('select');
 
    $('.dev-map-tabindex').removeClass('visible');
    const $currentTab = $(`.dev-map-tabindex[tab-data="tab${index}"]`);
    $currentTab.addClass('visible');
 
    $currentTab.find('h3').text(title);
  });
}

$(document).ready(function () {
  initDevTabs();
});
function initSmoothScroll() {
  $(document).on('click', '.scroll-to, .wellcome-action a,.revolution-bottom a', function (e) {
    const target = $(this).attr('href');

    if (target && target.startsWith('#')) {
      e.preventDefault();
      const offsetTop = $(target).offset().top;

      $('html, body').animate({
        scrollTop: offsetTop
      }, 600);  
    }
  });
}

$(document).ready(function () {
  initSmoothScroll();
});
 $(".language-cell").click(function() {
	$(this).toggleClass("visible");
}); 
document.addEventListener('DOMContentLoaded', function() {
  const playBtn = document.getElementById('play-video');
  const videoCover = document.querySelector('.video-cover');
  const videoId = 'zaSodEcDw-E'; // ID video link
  
  playBtn.addEventListener('click', function() {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    
 
    const closeBtn = document.createElement('button');
    closeBtn.id = 'close-video';
    closeBtn.innerHTML = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '15px';
    closeBtn.style.right = '15px';
    closeBtn.style.zIndex = '12';
    closeBtn.style.background = 'rgba(0,0,0,0.5)';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.width = '40px';
    closeBtn.style.height = '40px';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    
 
    videoCover.innerHTML = '';
    videoCover.appendChild(iframe);
    videoCover.appendChild(closeBtn);
    
 
    closeBtn.addEventListener('click', function() {
 
      iframe.src = '';
 
      videoCover.removeChild(iframe);
      videoCover.removeChild(closeBtn);
 
      videoCover.innerHTML = '';
      videoCover.appendChild(playBtn);
    });
  });
});
  const cryptoList = document.getElementById('crypto-list');

  fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=40&page=1&sparkline=false')
    .then(response => response.json())
    .then(data => {
      data.forEach(coin => {
        const priceChange = coin.price_change_percentage_24h;
        const priceChangeClass = priceChange >= 0 ? 'up' : 'down';
        const item = document.createElement('li');
        item.innerHTML = `
          <div class="crypto-item-body">
            <div class="crypto-item-logo">
              <img src="${coin.image}" alt="${coin.name}">
            </div>
            <div class="crypto-item-details">
              <div class="crypto-item-title"><strong>${coin.name}</strong> (${coin.symbol.toUpperCase()})</div>
              <div class="crypto-item-data">
                $${coin.current_price.toLocaleString()}
                <small class="${priceChangeClass}">${priceChange.toFixed(2)}%</small>
              </div>
            </div>
          </div>
        `;
        cryptoList.appendChild(item);
      });

      // Теперь, когда список готов — инициализируем slick
      $('#crypto-list').slick({
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        arrows: false,
        dots: false,
        speed: 4000,
        autoplaySpeed: 0,
        cssEase: 'linear',
        variableWidth: true
      });
    })
    .catch(error => {
      console.error('Ошибка при загрузке данных:', error);
      cryptoList.innerHTML = '<li>Не удалось загрузить данные</li>';
    });
$("#mobile-btn").click(function() {
	$("body ").toggleClass("viewNavMobile");
});
 $(".nav-list li a").click(function() {
	$("body ").removeClass("viewNavMobile");
}); 