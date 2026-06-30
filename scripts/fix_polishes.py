import re

with open('src/features/quiz/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update lucide imports to include ChevronRight
content = re.sub(
    r'import { Loader2 } from "lucide-react";',
    r'import { Loader2, ChevronRight } from "lucide-react";',
    content
)

# 2. Update the button to use ChevronRight
# Find the CTA span and the SVG right next to it
cta_replacement = r'<span className="text-sm sm:text-base tracking-wide">Start Practicing Now</span>\n              <ChevronRight className="w-5 h-5" />'
content = re.sub(
    r'<span className="text-sm sm:text-base tracking-wide">Start Practicing Now</span>\s*<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    cta_replacement,
    content
)

# 3. Compact Greeting section
# Replace the h1 sizing classes
# Old: text-3xl sm:text-4xl lg:text-5xl
# New: text-xl sm:text-2xl lg:text-3xl (half the perceived visual size / weight scale)
content = re.sub(
    r'<h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-0\.5 drop-shadow-sm">',
    r'<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight drop-shadow-sm">',
    content
)

# 4. Make it more compact overall by reducing spacing on the wrapper
content = re.sub(
    r'<div className="flex-1 flex flex-col space-y-4 py-2 relative z-10 animate-fade-in w-full">',
    r'<div className="flex-1 flex flex-col space-y-3 py-1 relative z-10 animate-fade-in w-full">',
    content
)
content = re.sub(
    r'<p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">',
    r'<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-snug font-medium">',
    content
)

with open('src/features/quiz/components/Dashboard.tsx', 'w') as f:
    f.write(content)
