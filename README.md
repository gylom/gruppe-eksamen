# gruppe-eksamen
Eksamen Gokstad Akademiet


# Quick start

## Requirements
- Docker Desktop
- .NET SDK
- Node.js + npm

## Windows
```bash
npm install
npm run start:win
```

## Each member must clone the repo once.
Option A — Using GitHub Desktop 
Download GitHub Desktop
Steps:
File → Clone repository
Choose your repository
Select a folder
Click Clone
Done.

## Option - Using Jetbrains Rider UI

<img width="762" height="100" alt="image" src="https://github.com/user-attachments/assets/2ce95079-c524-4c52-a5ab-248a49855842" />
<img width="795" height="255" alt="image" src="https://github.com/user-attachments/assets/a1de5e4d-e0f3-4d21-bd1e-24ed366639fa" />



## Option C — Using Git in for example JetBrains Rider terminal
Install Git
Run:
git clone https://github.com/gylom/gruppe-eksamen.git

### This downloads the project folder.

# Basic Workflow (Very Important)
Every time you work on the project:

1️⃣ Get the latest files

git pull

This downloads changes your teammates made.

2️⃣ Make your changes

Edit files normally.

3️⃣ Add files to commit

git add .

(git add .) adds all files to be changed/pushed

(git add program.cs) only adds program.cs file to be changed/pushed

(git add folder-name/) = all files in folder for example (git add backend/  )


4️⃣ Commit your changes

git commit -m "Added login feature"

5️⃣ Upload to GitHub

git push

# Daily Workflow

git pull
(make changes)

git add .

(git add .) adds all files to be changed/pushed

(git add program.cs) only adds program.cs file to be changed/pushed

(git add folder-name/) = all files in folder for example (git add backend/  )

git commit -m "describe change"

git push


# Commands

git clone https://github.com/gylom/gruppe-eksamen.git        # download repo first time

git pull             # download newest changes

git add .            # stage all changes in all files

git add program.cs            # stage all changes in file program.cs

git add backend/            # stage all changes in backend folder

git commit -m "msg"  # save change

git push             # upload to GitHub


git status     # check if all OK, nothing red.
