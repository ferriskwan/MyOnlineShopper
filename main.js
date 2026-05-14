class ProductDeal extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        .deal {
            border: 1px solid #ddd;
            padding: 1rem;
            border-radius: 0.5rem;
            background-color: var(--card-background);
            box-shadow: 0 4px 6px var(--shadow-color);
            display: grid;
            gap: 1rem;
            grid-template-areas:
              "image title price"
              "image description description";
            grid-template-columns: 100px 1fr auto;
        }
        .deal:hover {
            box-shadow: 0 8px 12px var(--shadow-color);
        }
        .deal img {
            grid-area: image;
            width: 100%;
            border-radius: 0.5rem;
        }
        .deal-title {
            grid-area: title;
            font-weight: bold;
        }
        .deal-price {
            grid-area: price;
            color: var(--secondary-color);
            font-size: 1.2rem;
            font-weight: bold;
            text-align: right;
        }
        .deal-description {
            grid-area: description;
        }

      </style>
      <div class="deal">
          <img src="${this.getAttribute('image')}" alt="${this.getAttribute('title')}">
          <div class="deal-title">${this.getAttribute('title')}</div>
          <div class="deal-price">${this.getAttribute('price')}</div>
          <p class="deal-description">From ${this.getAttribute('store')}</p>
      </div>
    `;

    shadow.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('product-deal', ProductDeal);

document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const query = document.getElementById('search-input').value;
    if (query) {
        displaySearchResults(query);
    }
});

async function displaySearchResults(query) {
    const resultsContainer = document.getElementById('results-container');
    const headerEl = document.querySelector('#results-section h2');
    resultsContainer.innerHTML = '<p>Loading deals, please wait...</p>'; // Loading state
    headerEl.textContent = `Searching for "${query}"...`;

    try {
        const response = await fetch(`http://localhost:3000/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        resultsContainer.innerHTML = ''; // Clear loading
        
        const allDeals = [...data.amazon, ...data.shopee, ...data.lazada, ...(data.google || [])];
        
        if (allDeals.length === 0) {
             resultsContainer.innerHTML = '<p>No deals found.</p>';
             return;
        }

        headerEl.textContent = `Top Deals for "${query}"`;

        allDeals.forEach(item => {
            const productDeal = document.createElement('product-deal');
            productDeal.setAttribute('title', item.title);
            productDeal.setAttribute('price', item.price);
            productDeal.setAttribute('store', item.store);
            productDeal.setAttribute('image', item.image);
            
            // Allow making it clickable
            productDeal.addEventListener('click', () => {
                if (item.link && item.link !== '#') {
                    window.open(item.link, '_blank');
                }
            });
            productDeal.style.cursor = 'pointer';

            resultsContainer.appendChild(productDeal);
        });
    } catch (error) {
        console.error('Error fetching deals:', error);
        resultsContainer.innerHTML = '<p>Failed to load deals. Is the backend server running?</p>';
        headerEl.textContent = `Error`;
    }
}