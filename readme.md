# ✨Blog Genius AI

**Blog Genius AI** is an intelligent blog generation platform powered by cutting-edge AI technology. Built with Next.js, it allows users to effortlessly generate blog titles, thumbnails, and descriptions. Users can also manage their blog content by editing, deleting, and reading posts manually, providing full control over the blog creation process.


## 🚀 Features

- **Create, read, update, and delete blogs**
- **Fetch blogs by category, popularity, or latest**
- **Full-text fuzzy search using [Fuse.js](https://fusejs.io/)**
- **React (like/unlike) functionality with user email tracking**
- **Category-wise counts and pagination**
- **API for featured and random blogs**


## 🔧 Setup Instructions

1. Clone the repo

```bash
git clone https://github.com/your-username/your-backend-repo.git
cd your-backend-repo
```

2. Install dependencies

```bash
npm install
```

3.Create a .env file in the root with:

```env
DB_URL=mongodb+srv://<your-credentials>@cluster.mongodb.net/?retryWrites=true&w=majority
```

4. Run the server

```bash
node api/index.js
```



# 📚 Blog Genius API Endpoints

### ✅ Blog CRUD

- `POST /blogs/create`  
  Create a new blog.

- `GET /blogs/:id`  
  Get a single blog by ID.

- `PUT /blogs/update/:id`  
  Update an existing blog by ID.

- `DELETE /blogs/delete/:id`  
  Delete a blog by ID.

---

### 📂 Fetch Blogs

- `GET /blogs/latest`  
  Get the latest blogs.

- `GET /blogs/popular`  
  Get the most liked (popular) blogs.

- `GET /blogs/category/:categoryName?page=1&limit=10`  
  Get blogs by category with pagination.

- `GET /blogs/featured`  
  Get featured blogs.

- `GET /blogs/random`  
  Get random blogs.

---

### 🔍 Full-Text Search

- `GET /search?q=keyword`  
  Search blogs using Fuse.js fuzzy search.

---

### ❤️ React (Like/Unlike)

- `POST /blogs/like/:id`  
  Like or unlike a blog. Requires `{ email: "user@example.com" }` in the request body.

---

### 📊 Blog Statistics

- `GET /blogs/category-counts`  
  Get blog counts by category.



# 🔗 Frontend Integration

The frontend for Blog Genius can be accessed at: [here](https://github.com/Mustafiz82/blog-genius)

---

# ✍️ Author

- **Name:** Mustafiz Rahman 
- **GitHub:** [@Mustafiz82](https://github.com/Mustafiz82)  
- **Email:** [mustafiz8260@gmail.com](mailto:mustafiz8260@gmail.com)  
- **Portfolio:** [yourportfolio.com](https://mustafizrahman.vercel.app/)

---

> Built with ❤️ using Node.js, Express, and MongoDB.
