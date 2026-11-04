import urllib.request
import urllib.parse
import json

api_key = '2dca580c2a14b55200e784d157207b4d'
modern = [
    ('Oppenheimer', 2023),
    ('Dune: Part Two', 2024),
    ('Barbie', 2023),
    ('Top Gun: Maverick', 2022),
    ('Spider-Man: No Way Home', 2021),
    ('Everything Everywhere All at Once', 2022),
    ('Gladiator II', 2024),
    ('Inside Out 2', 2024),
    ('Deadpool & Wolverine', 2024),
    ('Avatar: The Way of Water', 2022)
]

print("Testing Modern Movies (2019-2026) search on TMDB:")
for title, year in modern:
    q = urllib.parse.quote(title)
    url = f"https://api.themoviedb.org/3/search/movie?api_key={api_key}&query={q}&year={year}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=3.0) as res:
        data = json.loads(res.read().decode('utf-8'))
        results = data.get('results', [])
        if results:
            top = results[0]
            print(f"{title:<35} -> TMDB ID: {top['id']:<7} | {top['title']:<30} | {top['poster_path']}")
