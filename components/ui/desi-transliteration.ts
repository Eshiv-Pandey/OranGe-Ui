/** Small, offline phonetic transliterator. It does not call a language service. */
const words: Record<string, string> = { namaste: "नमस्ते", namaskar: "नमस्कार", hindi: "हिंदी", bharat: "भारत", rang: "रंग", rangon: "रंगों", duniya: "दुनिया", pyaar: "प्यार", shukriya: "शुक्रिया", dhanyavaad: "धन्यवाद", mera: "मेरा", meri: "मेरी", hai: "है", hain: "हैं", aap: "आप", dost: "दोस्त", dosti: "दोस्ती", kaisa: "कैसा", kaise: "कैसे", ho: "हो", dil: "दिल", desi: "देसी", zindagi: "ज़िंदगी" };
const consonants: Record<string, string> = { ksh: "क्ष", jny: "ज्ञ", chh: "छ", kh: "ख", gh: "घ", ch: "च", jh: "झ", th: "थ", dh: "ध", ph: "फ", bh: "भ", sh: "श", ng: "ङ", ny: "ञ", k: "क", g: "ग", c: "क", j: "ज", t: "त", d: "द", n: "न", p: "प", b: "ब", m: "म", y: "य", r: "र", l: "ल", v: "व", w: "व", s: "स", h: "ह", f: "फ़", z: "ज़", q: "क़" };
const vowels: Record<string, [string, string]> = { aa: ["आ", "ा"], ai: ["ऐ", "ै"], au: ["औ", "ौ"], ee: ["ई", "ी"], ii: ["ई", "ी"], oo: ["ऊ", "ू"], uu: ["ऊ", "ू"], ri: ["ऋ", "ृ"], a: ["अ", ""], i: ["इ", "ि"], u: ["उ", "ु"], e: ["ए", "े"], o: ["ओ", "ो"] };
const consonantKeys = Object.keys(consonants).sort((a, b) => b.length - a.length), vowelKeys = Object.keys(vowels).sort((a, b) => b.length - a.length);

export function transliterateRomanWord(value: string): string {
  const word = value.toLowerCase();
  if (words[word]) return words[word];
  let output = "", index = 0, pendingConsonant = false;
  while (index < word.length) {
    const vowel = vowelKeys.find((key) => word.startsWith(key, index));
    if (vowel) { output += vowels[vowel][pendingConsonant ? 1 : 0]; pendingConsonant = false; index += vowel.length; continue; }
    const consonant = consonantKeys.find((key) => word.startsWith(key, index));
    if (consonant) { if (pendingConsonant) output += "्"; output += consonants[consonant]; pendingConsonant = true; index += consonant.length; continue; }
    output += word[index++]; pendingConsonant = false;
  }
  return output;
}

/** Already pasted Devanagari, mixed scripts, numbers, whitespace and punctuation survive. */
export function transliterateToHindi(text: string): string {
  return text.replace(/[A-Za-z]+/g, transliterateRomanWord);
}
