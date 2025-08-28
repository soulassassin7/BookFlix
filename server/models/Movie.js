import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const movieSchema = new Schema({
    _id: { type: String, required: true },
    originalTitle: { type: String, required: true },
    description: { type: String, required: true },
    primaryImage: { type: String, required: true },
    thumbnails: { type: Array, required: true },
    trailer: {type: String},
    releaseDate: { type: String, required: true },
    original_language: { type: Array },
    genres: { type: Array, required: true },
    casts: { type: Array, required: true },
    averageRating: { type: Number, required: true },
    runtime: { type: Number, required: true },
    numVotes: { type: Number}
}, { timestamps: true })

export default mongoose.model('Movie', movieSchema);

