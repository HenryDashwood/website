---
title: "Bioinformatics"
---

It is my big project over the next year to break into the world of biotech. To that end I am writing this document. It is somewhat inspired by Stephen Diehl's [What I Wish I Knew When Learning Haskell](dev.stephendiehl.com/hask/) and Evan Chen's [An Infinitely Large Napkin](https://web.evanchen.cc/napkin.html).

## What is a gene?

### Medelian Genetics

### Bio

The central dogma of biology (coined by Francis Crick) says that information flows in one direction from **DNA** to **RNA** to **proteins**. Pieces of DNA called **exons** are **transcribed** into RNA. RNA is molecularly the same as DNA, except for thiamine which becomes uracil in RNA. RNA is also single, as opposed to double, stranded. Instead of the 4 nucleic acids, proteins in the human body are made of 20 different types of **amino acid**. A typical protein is 300-400 amino acids long. Three letters of RNA encode an amino acid. This is called **translation** As there are 4 possible RNA nucleotides, there are $$4^3 = 64$$ possible triplets. More combinations than amino acids. 3 triplets are stop codons, which indicate the end of a protein.

The human genome contains 3,200,000,000 or $$3.2\times10^9$$ base pairs, distributed among 46 chromosomes, plus mitochondial DNA. There are 23,000 protein-coding genes. Unrelated human genomes differ by ~0.1%. Many of the differences are in the form of isolated base substitutions, or **single-nucleotide polymorphisms (SNPs)**. Other differences include small deletions or variation in the length of repetitive regions, including variation in the number of copy genes.

Your **genotype** is your DNA sequence, both nuclear and mitochrondrial. Plants also have chloroplast DNA. Your **phenotype** is the collection of observable traits other than your DNA sequence. **Phamacogenetics** is the persuit of personalised drugs based on DNA sequences for the prevention and treatment of disease. Your **life hisory** is the integrated total of your physical and psychological experiences.

The cells in your body except for gametes (sperm and egg cells), erythrocytes (red blood cells), and cells of the immune system have the same DNA sequence. **Epigenetics** is the study of how your behaviour and environment can cause changes that affect the way your genes work, without altering your DNA sequence.

| Feauture                                       |                 Prokaryotic Cell                 |                                     Eukaryotic Cell                                     |
| :--------------------------------------------- | :----------------------------------------------: | :-------------------------------------------------------------------------------------: |
| _Size_                                         |                    10$$\mu$$m                    |                                       100$$\mu$$m                                       |
| _Subcelluar Division_                          |                    No nucleus                    |                                         Nucleus                                         |
| _State of major component of genetic material_ | Circular loop, few proteins permenantly attached |                       Complexed with histones to form chromosomes                       |
| _Internal differentiation_                     |        No organised subcellular structure        | Nuclei, mitochondria, chloroplasts, cytoskeleton,endoplasmic reticulum, Golgi apparatus |
| _Cell division_                                |                     Fission                      |                                  Mitosis (or meiosis)                                   |

**Mitochondia** and **chloroplasts** are subcellular particles involved in energy transduction. The former carry out **oxidative phosphorilation**, the coversion or reducing power from metabolising food into **adenosine triphosphate (ATP)**. The latter carry out photosynthises, the capture of light energy in the form of **nicotinamade adenine dinucleotide phosphate (NADPH)** and ATP, leading to the synthesis of sugars.

The nucleic acids are **adenine**, **guanine**, **cytosine**, **thymine**, and **uracil**. A and G have two rings and are called **purines**. C, T, and U and have one ring and are called **pyrimidines**. As always bind to Ts and and Cs always bind to Gs. This lets us tell from one strand of DNA what will be on the other and is also enables the DNA to copy itself.

DNA has a direction based on the biochemical properties at each end, the 5 prime end and the 3 prime end. We write one strand 5' to 3' and call that the positive strand. The reverse compliment is written 3' to 5' and called the negative strand.

$$
5' - ACACCGGTT - 3'
$$

$$
3' - TGTGGCCAA - 5'
$$

To make a copies of DNA we attach a primer to each end. We seperate the the strands by warming it up to 94 degrees. When the DNA cools down to 54 degrees, the separated strands stick to their respective primers. At 72 degrees we then use the copyier molecule **DNA polymerase** which looks for sites where the DNA is double stranded and then goes along the single stranded gap filling it in. You also need to add raw nucleic acids for the polymerase to use. We can then repeat the cycle, doubling the amount of DNA each time. This is known as a **polymerase chain reaction (PRC)**

## Methods of DNA Sequencing

### First Generation Sequencing

**First Generation Sequencing** was developed by Frederick Sanger. It is also known as **chain termination sequencing**.

### Next Generation Sequencing

**Next Generation Sequencing**, also known as **massively parallel sequencing** came into use after the **Human Genome Project**. It works by chopping up DNA into single stranded fragments attached to a slide. PCR is then used to make clusters of identical fragements on the slide. Nucleotides are then added so that they bind with a single base in each fragment of DNA. They are modified to fluoresce in different colours so we can take pictures to see which base is present and also to have a terminator molecule so we only add one at a time. It is not perfect as errors increase in later cycles which is why it used on short strands of DNA.

RNA chops up DNA into **exons** and **introns**. Introns get thrown away while exons are concatenated together and translated into proteins. Exons make up your **exome**. It is only ~1.5% of your genome and therefore much more practical to sequence. A protein coding region contains **Open Reading Frames (ORF)**. An ORF is a region of DNA sequence, or reasonable length, that begins with an initiation codon. An ORF is a potential protein coding region. Genes in prokaryots are smaller and do not have introns.

Since RNA is single stranded it can't be sequenced. However, we can transcribe it into **complimentary DNA (cDNA)** with a molecule called **reverse transcriptase**

### Identifying genes in genomes

An early step in analyising a newly-sequenced genome is identiying the genes that code for proteins and RNAs, and to identify their products. There are two basic approaches:

1. _A priori_ methods seek to recognise sequence patterns within expressed genes and the regions flanking them. Protein coding regions have distinctive patterns of codon statistics such as the abscence of stop codons.

2. _"Been there, seen that"_ methods recognise regions corresponding to previously known genes from the similarity of their translated amino acid sequences to known proteins in other species, or by matching **Expressed Sequence Tags (EST)**. ESTs are sequences that correspond to at least part of a transcribed gene.

### Haplotypes

**Haplotypes**, or _haploid genotypes_ are local combinations of genetic polymorphisms that tend to be co-inherited. They are a cheap way to characterise genomes.

Mutations in the same DNA molecule in diploid chromasomes will become unlinked by recombination events the occur between their loci. The greater the separation between two sites, the greater the frequency of recombination. Recombination rates vary widely along the genome, by several orders of magnitude. SNPs on opposite sides of recombinational hotspots are more likely to be separated in any generation. SNPs in recombination rare coldspots will tend to stay together.

In humans, many 100-kb regions tend to remain intact. They show the expected number of genomes but relatively few of the possible combinations. An average SNP density of 0.1%, or 1 SNP/kb, suggests ~100 SNPs per 100kb. The genome of any idividual may posses or lack each of them giving $2^{100}$ possible combinations. However, many 100-kb regions have fewer than 5 combinations of SNPs. These discrete combinations of SNPs in recombination-poor regions define an individual's haplotype.

### De novo sequencing

Sequncing the genome of a species for the first time is hard because the data comes to us in fragments and we have to reference to guide us as we try to stitch it together. The fragments are typically about 200bp long. High-throughput sequencing produces partial sequence information from both these fragments either from one end or both ends. The number of bases reported is the **read length**. We want to make our read length as big as possible. We then need to assemble the fragments into a continuous stretch of sequence. These partial assemblies are called **contigs**. We need enough fragments to cover the entire genome and then more so that we can detect errors. The ratio of the total number of bases sequenced to the genomes actual length is called the **coverage**. Complete and accurate results require a coverage of 30 to 50.

This process is generally enough for prokaryotic genomes. Eukaryotic genomes are more complicated. They need to be broken into smaller pieces and built back up with a genetic map. It's very computationally expensive.

### Reference genomes

Once a reference genome is published. Future sequences can be mapped onto it. This is straightforward except for highly repetative regions. Coverage must be adequate so that the error rate of sequence determination is less than natural variation.

## File Formats

For the purpose of compression, DNA bases are often stored as just two bits. Specififcally:

|     |     |
| :-: | :-: |
|  A  | 00  |
|  C  | 01  |
|  G  | 10  |
|  T  | 11  |

More modern formats make use of the probablilty certain bases appear at certain locations.

### FASTA.

Used in the 1980s by ... In FASTA format sequences of nucleatoides are represented by single letters. The first line of a FASTA file begins with a `>` or less commonly a `;`. Below is the first 5 lines of an example FASTA file.

```text
>NM_002299.4 Homo sapiens lactase (LCT), mRNA
GAAAATGGAGCTGTCTTGGCATGTAGTCTTTATTGCCCTGCTAAGTTTTTCATGCTGGGG
GTCAGACTGGGAGTCTGATAGAAATTTCATTTCCACCGCTGGTCCTCTAACCAATGACTT
GCTGCACAACCTGAGTGGTCTCCTGGGAGACCAGAGTTCTAACTTTGTAGCAGGGGACAA
AGACATGTATGTTTGTCACCAGCCACTGCCCACTTTCCTGCCAGAATACTTCAGCAGTCT
```

### FASTQ

An extension of FASTA. Used in Next Generation Sequencing. It generally produces bigger files which can create headaches when transferring data.

### Binary Alignment Map (BAM)

After receiving data from the sequencer, you will normally use a tool such as Burrows-Wheeler Aligner (BWA) to align your sequences to a reference genome. Most users will have a reference genome for their species.

The most common representation for aligned data is the sequence alignment map (SAM) format. The compressed version of SAM is BAM. Indexable for extremely fast random access e.g. to find alignments to a certain part of a chromosome. You need an index for your BAM file which is normally created by the tabix utility of SAMtools, the most widely used tool for manipulating SAM/BAM files.

### Variant Call Format (VCF)

## Databases

- National Center for Biotechnology Information (NCBI)
- - GenBank
- - Nucleotide Database
- - PubMed

## Metrics

### Phred quality score

Logarithmic representation of the probability of an accurate call. This probability is given as $$10^{-Q/10}$$. So a Q of 10 represents a 90 percent call accuracy, 20 represents 99 percent call accuracy, and 30 will be 99.9 percent. For our file, the maximum accuracy will be 99.99 percent (40). In some cases, values of 60 are possible (99.9999 percent accuracy).

## Algorithms

### Reverse Complement

Gets the bases from the opposite strand of DNA

```python
def reverseComplement(s):
    complement = {'A': 'T', 'C': 'G', 'G': 'C', 'T': 'A', 'N': 'N'}
    t = ''
    for base in s:
        t = complement[base] + t
    return t
```

### Naive Sequence Matching

Slow but simple way of solving the read alignemnt problem

```python
def naive(p, t):
    occurrences = []
    for i in range(len(t) - len(p) + 1): # loop over alignments
        match = True
        for j in range(len(p)): # loop over characters
            if t[i+j] != p[j]: # compare characters
                match = False
                break
        if match:
            occurrences.append(i) # all chars matched; record
    return occurrences
```

### Boyer Moore Matching

## Tools

- [Biopython](https://biopython.org)
- FastQC
- [MultiC](https://multiqc.info/)
- SAMTools
- [Trimmomatic](http://www.usadellab.org/cms/?page=trimmomatic)
- [Trimmomatic manual](http://www.usadellab.org/cms/uploads/supplementary/Trimmomatic/TrimmomaticManual_V0.32.pdf)
- [STAR](https://github.com/alexdobin/STAR)
- [HTSeq](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4287950/)
- FastP
- [Pysam](https://github.com/pysam-developers/pysam)
- Kraken2

## Epigenetics

Illumina make the most popular machines for reading DNA methylation.

## Futher Resources

### Youtube

[Alex Soupir](https://www.youtube.com/user/alexsoupir/about)

[Simon Cockell](https://www.youtube.com/c/SimonCockell/about)

### Books

### Courses
