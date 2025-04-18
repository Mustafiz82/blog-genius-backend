const express = require("express");
const cors = require("cors");
const Fuse = require("fuse.js");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.DB_URL;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

// ✅ MongoDB Connection
async function connectDB() {
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
        console.log("Connected to MongoDB");
    }
}

app.get("/", (req, res) => {
    res.send("Simple CRUD is running");
});

// ✅ Restore: Create a new blog
app.post("/blogs", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        const { id, title, blog, thumbnail, category, tags, authorName, authorEmail } = req.body;

        if (!id || !title || !blog || !category || !authorName || !authorEmail) {
            return res.status(400).json({ error: "Required fields are missing" });
        }

        const newBlog = {
            id, title, blog, authorEmail,
            thumbnail: thumbnail || "",
            category, tags: tags || [],
            authorName, createdAt: new Date(),
            reactCount: 0,
            reactedUsers: [],
        };

        const result = await blogCollection.insertOne(newBlog);
        res.status(201).json({
            message: "Blog created successfully",
            blogId: result.insertedId,
            customId: id
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to create blog", details: error.message });
    }
});


app.get("/blogs/ids", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        // Fetch only the _id field (MongoDB's native ID)
        const blogIdsCursor = blogCollection.find({}, { projection: { _id: 1 } });
        const blogIds = await blogIdsCursor.toArray();

        // Returns: [{ _id: ObjectId("...") }, { _id: ObjectId("...") }]
        res.status(200).json(blogIds);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch blog _ids", details: error.message });
    }
});


app.post("/blogs/fetch", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        const { categories, random } = req.body;

        if (!categories || typeof categories !== "object") {
            return res.status(400).json({ error: "Invalid categories format" });
        }

        let response = {};

        // Fetch blogs based on category count
        for (const [category, count] of Object.entries(categories)) {
            response[category] = await blogCollection
                .aggregate([{ $match: { category } }, { $sample: { size: count } }])
                .toArray();
        }

        // Fetch random blogs if requested
        if (random) {
            response["random"] = await blogCollection.aggregate([{ $sample: { size: random } }]).toArray();
        }

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch blogs", details: error.message });
    }
});


// ✅ Restore: Get latest blogs
app.get("/blogs/latest", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        const blogs = await blogCollection
            .find({})
            .sort({ createdAt: -1 })
            .limit(6)
            .toArray();
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch latest blogs" });
    }
});

app.get("/blogs/featured", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        // Define the list of featured blog post ObjectIds
        const featuredIds = [
            new ObjectId("67ed26a2ab0ade3d405c4da6"),
            new ObjectId("67ed248aab0ade3d405c4da1"),
            new ObjectId("67ed2361ab0ade3d405c4d9f"),
            new ObjectId("67ed38a33f7fd53cf989391e")
        ];

        console.log("object");

        // Fetch the featured blogs using the $in operator to match the _id field
        const featuredBlogs = await blogCollection.find({ _id: { $in: featuredIds } }).toArray();

        if (featuredBlogs.length === 0) {
            return res.status(404).json({ message: "No featured blogs found" });
        }

        // Respond with the featured blogs
        res.status(200).json({
            message: "Featured blogs fetched successfully",
            data: featuredBlogs
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch featured blogs", details: error.message });
    }
});



app.get("/blogs/category-count", async (req, res) => {
    console.log("hit");
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");



        const categoryCounts = await blogCollection.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    count: 1
                }
            }
        ]).toArray();

        res.status(200).json({
            message: "Blog count by category fetched successfully",
            data: categoryCounts
        });
    } catch (error) {
        res.status(500).json({
            error: "Failed to count blogs by category",
            details: error.message
        });
    }
});





// ✅ Restore: Get popular blogs
app.get("/blogs/popular", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        console.log("Fetching popular blogs...");

        const blogs = await blogCollection
            .find({}, {
                projection: {
                    _id: 1,
                    id: 1,
                    title: 1,
                    thumbnail: 1,
                    category: 1,
                    tags: 1,
                    authorName: 1,
                    createdAt: 1,
                    reactCount: 1,
                }
            })
            .sort({ reactCount: -1 }) // ✅ Sort by popularity
            .limit(4) // ✅ Limit to 4 blogs
            .toArray();

        res.json(blogs);
    } catch (error) {
        console.error("Error fetching popular blogs:", error); // 🔍 Log the exact error
        res.status(500).json({ error: "Failed to fetch popular blogs", details: error.message });
    }
});




// ✅ Restore: Get blogs by category
// app.get("/blogs/category", async (req, res) => {
//     try {
//         await connectDB();
//         const database = client.db("BlogDB");
//         const blogCollection = database.collection("blogs");

//         const { category, page = 1, limit = 10 } = req.query;
//         const skip = (page - 1) * limit;

//         // Use regular expression with 'i' flag for case-insensitive matching
//         const categoryQuery = new RegExp(`^${category}$`, 'i');

//         const blogs = await blogCollection
//             .find({ category: categoryQuery })  // Updated query to be case-insensitive
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(parseInt(limit))
//             .toArray();

//         res.json(blogs);
//     } catch (error) {
//         res.status(500).json({ error: "Failed to fetch blogs by category" });
//     }
// });



app.get("/blogs/category", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        const { category, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * parseInt(limit);

        // Fast category filtering
        const categoryQuery = new RegExp(`^${category}$`, 'i');

        const blogs = await blogCollection.aggregate([
            { $match: { category: categoryQuery } },  // ✅ Filter by category
            { $sort: { createdAt: -1 } },  // ✅ Sort by latest
            { $skip: skip },  // ✅ Pagination
            { $limit: parseInt(limit) },  // ✅ Limit results
            {
                $project: {
                    _id: 1,
                    id: 1,
                    title: 1,
                    thumbnail: 1,
                    category: 1,
                    tags: 1,
                    authorName: 1,
                    createdAt: 1,
                    reactCount: 1,
                    // ✅ Extract first paragraph → If no paragraph, take quote → If no quote, take header
                    description: {
                        $reduce: {
                            input: "$blog.blocks",
                            initialValue: { text: null, found: false },
                            in: {
                                $cond: {
                                    if: "$$value.found", // If already found, keep it
                                    then: "$$value",
                                    else: {
                                        $cond: {
                                            if: { $eq: ["$$this.type", "paragraph"] },
                                            then: { text: "$$this.data.text", found: true }, // Stop at paragraph
                                            else: {
                                                $cond: {
                                                    if: { $and: [{ $eq: ["$$this.type", "quote"] }, { $eq: ["$$value.text", null] }] },
                                                    then: { text: "$$this.data.text", found: false }, // If no paragraph, store quote
                                                    else: {
                                                        $cond: {
                                                            if: { $and: [{ $eq: ["$$this.type", "header"] }, { $eq: ["$$value.text", null] }] },
                                                            then: { text: "$$this.data.text", found: false }, // If no paragraph or quote, store header
                                                            else: "$$value" // Keep existing value
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            // ✅ Extract only the text value from the object
            {
                $set: {
                    description: "$description.text"
                }
            }
        ]).toArray();

        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch blogs by category" });
    }
});


// ✅ Restore: Get blog details by ID
app.get("/blogs/:id", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        const { id } = req.params;
        const blog = await blogCollection.findOne({ _id: new ObjectId(id) });

        if (!blog) return res.status(404).json({ error: "Blog not found" });

        res.json(blog);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch blog details" });
    }
});

app.post("/blogs/my-blogs", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        const { email } = req.body;

        // Validate input
        if (!email || typeof email !== "string" || email.trim().length === 0) {
            return res.status(400).json({ error: "Valid email is required" });
        }

        // Fetch all blogs by this email
        const userBlogs = await blogCollection.find({ authorEmail: email }).toArray();

        if (!userBlogs || userBlogs.length === 0) {
            return res.status(404).json({ error: "No blogs found for this email" });
        }

        res.json(userBlogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch blog details" });
    }
});

// ✅ Restore: Delete blog by ID
app.delete("/blogs/:id", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        const { id } = req.params;
        const result = await blogCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Blog not found" });
        }

        res.json({ success: true, message: "Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete blog" });
    }
});

// ✅ Restore: Update blog by ID
app.put("/blogs/:id", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        const { id } = req.params;
        const { title, blog, thumbnail, category, tags, authorName, authorEmail } = req.body;

        const updateFields = {};
        if (title) updateFields.title = title;
        if (blog) updateFields.blog = blog;
        if (thumbnail) updateFields.thumbnail = thumbnail;
        if (category) updateFields.category = category;
        if (tags) updateFields.tags = tags;
        if (authorName) updateFields.authorName = authorName;
        if (authorEmail) updateFields.authorEmail = authorEmail;

        const result = await blogCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Blog not found or no changes made" });
        }

        res.json({ message: "Blog updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update blog" });
    }
});



app.post("/blogs/search", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        console.log("hit");
        const { query } = req.body;  // The user will only input the search query

        // Validate input
        if (!query || typeof query !== "string" || query.trim().length === 0) {
            return res.status(400).json({ error: "Search query is required" });
        }

        // Fetch all blogs from the collection
        const allBlogs = await blogCollection.find().toArray();

        // **Fuse.js for comprehensive search**
        const fuse = new Fuse(allBlogs, {
            keys: ["title", "category", "tags", "authorName", "blog.blocks.data.text"],  // Searchable fields
            threshold: 0.3,  // Controls the fuzziness of the search (lower is more precise)
            ignoreLocation: true,  // Prevents location from influencing search
        });

        // Get results from Fuse.js search
        const searchResults = fuse.search(query).map(result => result.item);

        // Return the search results
        res.status(200).json(searchResults);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch blogs", details: error.message });
    }
});



app.patch("/blogs/react/:id", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        const blogId = req.params.id;
        const { email } = req.body;

        console.log(blogId);

        if (!email) {
            return res.status(400).json({ error: "User email is required" });
        }

        const blog = await blogCollection.findOne({ _id: new ObjectId(blogId) });

        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }
        console.log(blog);

        let update;
        let message;

        if (blog.reactedUsers?.includes(email)) {
            // User already reacted, remove their reaction
            update = {
                $pull: { reactedUsers: email },
                $inc: { reactCount: -1 }
            };
            message = "Reaction removed";
        } else {
            // User reacting for the first time
            update = {
                $addToSet: { reactedUsers: email },
                $inc: { reactCount: 1 }
            };
            message = "Reaction added";
        }

        await blogCollection.updateOne({ _id: new ObjectId(blogId) }, update);

        res.status(200).json({ message });
    } catch (error) {
        res.status(500).json({ error: "Failed to toggle reaction", details: error.message });
    }
});


app.post("/blog/react-status", async (req, res) => {
    try {
        await connectDB();
        const database = client.db("BlogDB");
        const blogCollection = database.collection("blogs");

        const { id, email } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Blog ID is required" });
        }

        // Handle case where email may not exist
        if (!email) {
            return res.status(200).json({ userReact: false, reactCount: 0 });
        }

        const blog = await blogCollection.findOne({ _id: new ObjectId(id) });

        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        const reactedUsers = blog.reactedUsers || [];

        const hasReacted = reactedUsers.includes(email);

        return res.status(200).json({
            userReact: hasReacted,
            reactCount: reactedUsers.length,
        });

    } catch (error) {
        console.error("Error in /blog/react-status:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});







// ✅ Export for Vercel (works on both local & production)
module.exports = app;

// ✅ If running locally, start Express server
if (require.main === module) {
    const port = process.env.PORT || 5144;
    app.listen(port, () => {
        console.log(`Server running locally on port ${port}`);
    });
}
