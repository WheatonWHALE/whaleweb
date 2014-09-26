import re
import requests
import time

from bs4 import BeautifulSoup

def updateCountsDict(deptEnrollDict, fileString):
    soup = BeautifulSoup(fileString, 'html.parser') # Have to use 'html.parser' parser, because it handles the broken HTML better

    classLabelTest = re.compile(r'[A-Z][A-Z][A-Z][A-Z]?-[0-9][0-9][0-9]')
    departmentMatcher = re.compile(r'[A-Z][A-Z][A-Z][A-Z]?')

    allRows = soup.find_all('tr')

    for i in xrange(len(allRows)):
        row = allRows[i]

        possibleClassLabel = row.find('td').getText().encode('utf-8').strip()

        if classLabelTest.match(possibleClassLabel):
            match = departmentMatcher.match(possibleClassLabel)
            department = possibleClassLabel[match.start():match.end()]

            if i + 2 < len(allRows):
                enrollmentElements = allRows[i+2].find_all('td')

                if len(enrollmentElements) < 3:
                    enrollmentElements = allRows[i+1].find_all('td')

            numEnrolled = int(enrollmentElements[2].getText().replace('Seats Taken: ', ''))

            if department not in deptEnrollDict:
                deptEnrollDict[department] = numEnrolled
            else:
                deptEnrollDict[department] += numEnrolled

def main():
    dataValues = {
        'intmajor_sch' : '%',
        'area_sch' : '%',
        'area_cat' : '%',
        'submit_btn' : 'Search Schedule',
        'subject_sch' : '%',
        'subject_cat' : '%',
        'foundation_sch' : '%',
        'schedule_beginterm' : '201510',
        'intmajor_cat' : '%',
        'division_sch' : '%',
        'foundation_cat' : '%',
        'crse_numb' : '%',
        'division_cat' : '%',
    }

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36',
        'Cookie': '_ga=GA1.2.99013180.1410794952; session=eyJyZWNlbnQiOlsiMTNxMHdjcDEiXX0.BviaPw.QJ5xAWB91r8I21WDad6uYYk6xPw',

    }

    yearsStart = 2010
    yearsEnd = 2015

    years = xrange(yearsStart, yearsEnd+1)
    semesters = xrange(10, 30, 10)

    deptDict = {}

    for year in years:
        for semester in semesters:
            dataValues['schedule_beginterm'] = str(year) + str(semester)

            r = requests.post('https://weblprod1.wheatonma.edu/PROD/bzcrschd.P_OpenDoor', data=dataValues, headers=headers)

            if r.status_code == 200:
                updateCountsDict(deptDict, r.content)
                # print deptDict
            else:
                print 'Problems:', r.status_code

    open('enrollment' + str(yearsStart) + '-' + str(yearsEnd) + '.json', 'w').write(str(deptDict).replace('\'', '"'))

if __name__ == '__main__':
    main()