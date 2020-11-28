const app = new Vue({
  el: '#app',
  data: {
    url: '',
    slug: '',
    error: '',
    magic: '',
    formVisible: true,
    created: null,
  },
  methods: {
    async createUrl() {
      this.error = '';
      const res = await fetch('/new', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          url: this.url,
          slug: this.slug || undefined,
          magic: this.magic
        }),
      });
      if (res.ok) {
        const result = await res.json();
        this.formVisible = false;
        this.created = result.url;
      } else if (res.status === 429) {
        this.error = 'You are sending too many requests. Try again in 30 seconds.';
      } else {
        const result = await res.json();
        this.error = result.message;
      }
    },
  },
});
