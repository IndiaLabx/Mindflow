import re

with open("src/features/quiz/components/Dashboard.tsx", "r") as f:
    content = f.read()

# Make the grid 2-column by default, 3/4 column on large displays
# Let's verify we have: className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl mx-auto z-20"
# This already meets the 2 column requirement on mobile/tablet and scaling up, so we will reduce the shadow / interactive styling to be visually quieter across all.

# Replacing "border-b-[4px]" with "border-b-[2px]" across all secondary cards to reduce depth.
# Replacing "blur-[60px]" with "blur-[40px]" across all secondary cards.
# Also change hover scale from 1.02 to 1.01 to feel lighter.

cards = [
    "rose", # English
    "amber", # Tools
    "emerald", # Analytics
    "blue", # Bookmarks
    "red", # Admin Room
    "cyan", # Download
    "slate", # About Us
]

for color in cards:
    # 1. border depth reduction
    old_border = f"border-b-[4px] border-b-{color}"
    new_border = f"border-b-[2px] border-b-{color}"
    content = content.replace(old_border, new_border)

    # 2. inner shadow reduction
    # Instead of doing shadow manipulation which can be tricky, we'll tone down the background blur glow.
    old_glow = f"blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-{color}-500"
    new_glow = f"blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-{color}-500"
    content = content.replace(old_glow, new_glow)

# Lower scale interaction
content = content.replace("whileHover={{ scale: 1.02 }}", "whileHover={{ scale: 1.01 }}")

with open("src/features/quiz/components/Dashboard.tsx", "w") as f:
    f.write(content)
