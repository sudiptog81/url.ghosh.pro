require("dotenv").config();

const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const express = require("express");
const { nanoid } = require("nanoid");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const PORT = process.env.PORT || 8083;

const app = express();

app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", express.static(path.join(__dirname, "../public")));
app.use("/assets", express.static(path.join(__dirname, "../public/assets")));

mongoose.connect(process.env.DB_URL || "localhost/urls", { useNewUrlParser: true });
mongoose.connection.once("open", () => console.log("Database Connected..."));
mongoose.connection.on("error", console.error.bind(console, "Connection Error: "));

const EntrySchema = new mongoose.Schema({
  url: {
    type: String,
    validate: v => RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/).test(v),
    required: true
  },
  slug: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
})

const Entry = mongoose.model("Entry", EntrySchema);

app.get("/all", (req, res) => {
  const { magic } = req.query;
  if (magic !== process.env.URL_MAGIC)
  {
    res.status(403).json({
      message: "Nope 👊"
    })
    return;
  }
  Entry
    .find({})
    .select("url slug -_id")
    .sort("-date")
    .exec((e, d) => e ? res.status(500).json({
      message: "Sorry 🙇‍♂️"
    }) : res.json(d))
});

app.get("/:id", (req, res) => {
  const { id: slug } = req.params;
  if (!slug) {
    res.send("../public/index.html");
    return;
  }
  Entry
    .findOne({ slug })
    .exec((e, d) => d?.url ?
      res.redirect(d.url) :
      res.status(500).json({
        message: "Sorry 🙇‍♂️"
      })
    );
});

app.post("/new", rateLimit({
  windowMs: 30 * 1000,
  max: 10,
  message: 'Rate-limited!', 
  headers: true
}), (req, res) => {
  const { url, slug, magic } = req.body;
  if (magic !== process.env.URL_MAGIC ||
      url.includes(process.env.URL_DOMAIN))
  {
    res.status(403).json({
      message: "Nope 👊"
    })
    return;
  }
  const entry = new Entry({
    url,
    slug: slug || nanoid(process.env.SLUG_LENGTH || 5)
  })
  entry.save(err => err ? res.status(500).json({
    message: 'Sorry 🙇‍♂️'
  }) : res.json({
    url: `https://${process.env.URL_DOMAIN}/${entry.slug}`
  }));
})

app.listen(PORT, () => console.log(`Running on Port ${PORT}...`));
