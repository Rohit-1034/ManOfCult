import urllib.request
import json
import pandas as pd

links = pd.read_csv('dataset_raw/ml-latest-small/links.csv')
movies = pd.read_csv('dataset_raw/ml-latest-small/movies.csv')
df = movies.merge(links, on='movieId')

sample = df.head(10)
api_key = '2dca580c2a14b55200e784d157207b4d'

print('Testing 10 movies mapping to TMDB:')
for _, row in sample.iterrows():
    tmdb_id = int(row['tmdbId']) if pd.notna(row['tmdbId']) else None
    if tmdb_id:
        url = f'https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={api_key}'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=3.0) as res:
                d = json.loads(res.read().decode('utf-8'))
                ml_title = row['title']
                tmdb_title = d.get('title')
                poster = d.get('poster_path')
                print(f"movieId: {row['movieId']:<4} | TMDB {tmdb_id:<6} | {ml_title:<30} -> {tmdb_title:<25} | {poster}")
        except Exception as e:
            print(f"movieId: {row['movieId']} error: {e}")
