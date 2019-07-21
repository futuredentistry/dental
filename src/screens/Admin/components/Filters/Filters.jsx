// @ts-nocheck
import React, { useContext, useState, useEffect } from 'react'
import { Parser } from 'json2csv'
import { makeStyles } from '@material-ui/styles';
import DateFnsUtils from '@date-io/date-fns'
import { format } from 'date-fns'
import { MuiPickersUtilsProvider } from 'material-ui-pickers'
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import NoSsr from '@material-ui/core/NoSsr'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'

import FirebaseContext from 'modules/Firebase';
import DateMultiPicker from 'ui/DateMultyPicker/DateMultiPicker';
import capitalizeFirstLetter from 'utils/capitalizeFirstLetter';

import LoadingRecords from './components/LoadingRecords'


const useStyles = makeStyles(() => ({
    formGrid: {
        paddingLeft: '0.5%',
        paddingRight: '0.5%',
    },
    //
    paper: {
        width: '100%',
        overflowX: 'auto',
    },
    table: {
        width: '100%',
    },
    hideCheck: {
        display: 'none',
    },
    button: {
        padding: 0,
        margin: 0,
        width: '100%'
    },
    allMenu: {
        marginBottom: '6px',
        backgroundColor: '#FE7F2D',
    }
}))

const risk = ['no', 'low', 'medium', 'high']
const searchDefault = {
    treatment: [],
    concern: [],
    organisation: [],
    risk,
}

const Filters = () => {
    const classes = useStyles()

    const [date, setDate] = useState([null, null])

    const [search, setSearch] = useState(searchDefault)

    const firebase = useContext(FirebaseContext)

    const [concern, setConcern] = useState([])
    const [treatment, setTreatment] = useState([])
    const [organisation, setOrganisation] = useState([])

    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    useEffect(() => {
        const treatment = []
        const organisation = []
        const concern = []
        const promises = []

        setLoading(true)

        promises.push(firebase.getTreatmentCollection()
            .then(
                querySnapshot => querySnapshot.forEach(doc => treatment.push(doc.id)),
            ).then(() => setTreatment(treatment)))

        promises.push(firebase.getConcernCollection()
            .then(
                doc => {
                    if (doc.exists) {
                        Object.values(doc.data()).map(value => concern.push(value))
                        setConcern(concern)
                    }
                }))

        promises.push(firebase.getOrganisationsCollection()
            .then(
                doc => {
                    if (doc.exists) {
                        Object.values(doc.data()).map(value => organisation.push(value))
                        setOrganisation(organisation)
                    }
                }))

        Promise.all(promises).then(() => {
            setSearch({ ...search, ...{ organisation, treatment, concern } })
            setLoading(false)
        })
    }, [])


    const sqlSearchData = () => {
        const searchReportSQL = firebase.searchReportSQL()
        const sortedDate = date.sort((a, b) => a - b)

        return searchReportSQL({
            organisation: search.organisation,
            risk: search.risk,
            caries: search.concern.includes('Caries') ? 1 : 0,
            gum_disease: search.concern.includes('Gum Disease') ? 1 : 0,
            wear: search.concern.includes('Wear') ? 1 : 0,
            trauma: search.concern.includes('Trauma') ? 1 : 0,
            cancer: search.concern.includes('Oral Cancer') ? 1 : 0,
            infection: search.concern.includes('Infection') ? 1 : 0,
            other: search.concern.includes('Other') ? 1 : 0,
            capping: search.treatment.includes('Capping') ? 1 : 0,
            crown: search.treatment.includes('Crown') ? 1 : 0,
            filling: search.treatment.includes('Filling') ? 1 : 0,
            root_canal: search.treatment.includes('Root Canal') ? 1 : 0,
            tooth_extraction: search.treatment.includes('Tooth Extraction') ? 1 : 0,
            date_start: sortedDate[0] && format(new Date(sortedDate[0]), 'Y-MM-d'),
            date_finish: sortedDate[1] && format(new Date(sortedDate[1]), 'Y-MM-d'),
        })
    }

    // Expected behavior
    // if all selected the first click deselect all except clicked one
    // cannot deselect all
    // can select all
    const selectSwitch = (e, name, defaultList) => {
        switch (true) {
            case e.target.value.includes('all'):
                setSearch({ ...search, ...{ [name]: defaultList } })
                break
            case e.target.value.length === 0:
            case e.target.value.length === defaultList.length - 1 &&
                !e.target.value.includes(e.currentTarget.dataset.value):
                setSearch({ ...search, ...{ [name]: [e.currentTarget.dataset.value] } })
                break
            default:
                setSearch({ ...search, ...{ [name]: e.target.value } })
        }
    }

    const searchReport = () => {
        setLoading(true)
        setReport(null)

        sqlSearchData()
            .then(r => {
                if (r.data.length > 0) setReport(r.data)
                setLoading(false)
                setError(false)
            })
            .catch(() => {
                setLoading(false)
                setError(true)
            })
    }

    const downloadReport = () => {
        const exportedFilename = `${new Date()}.csv`

        const json2csvParser = new Parser({ fields: Object.keys(report[0]) });
        const csv = json2csvParser.parse(report)

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, exportedFilename);
        } else {
            const link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", exportedFilename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

    return (
        <NoSsr>
            <Typography variant='h4'>
                Filters
            </Typography>

            <Grid container spacing={0} direction="row" >
                <Grid item xs={4} >
                    <Button disabled={loading || error || !report} onClick={() => downloadReport()} >Report</Button>
                </ Grid>
                <Grid item xs={4} >
                    {report && (
                        <Typography variant='body2'>
                            Reports: {report.length}
                        </Typography>
                    )}
                </ Grid>
                <Grid item xs={4} >
                    <Button disabled={loading} onClick={() => searchReport()} >Search</Button>
                </ Grid>
            </ Grid>

            <Grid container spacing={0} direction="row" >
                <Grid item xs={1} />

                <Grid item xs={2} className={classes.formGrid}>
                    <FormControl >
                        <InputLabel>Organisation</InputLabel>
                        {/* ToDo refactoring */}
                        <Select
                            variant="filled"
                            multiple
                            displayEmpty
                            value={search.organisation}
                            onChange={e => selectSwitch(e, 'organisation', organisation)}
                            autoWidth
                            renderValue={selected => selected.map(x => x).join(', ')}
                        >
                            <MenuItem value='all' className={classes.allMenu}>Select all</MenuItem>
                            {
                                organisation.map(value =>
                                    <MenuItem key={value} value={value}>{value}</MenuItem>
                                )
                            }
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={2} className={classes.formGrid}>
                    <FormControl>
                        <InputLabel>Concern</InputLabel>
                        {/* ToDo refactoring */}
                        <Select
                            variant="filled"
                            multiple
                            displayEmpty
                            value={search.concern}
                            onChange={e => selectSwitch(e, 'concern', concern)}
                            autoWidth
                            renderValue={selected => selected.map(x => x).join(', ')}
                        >
                            <MenuItem value='all' className={classes.allMenu}>Select all</MenuItem>
                            {
                                concern.map(value =>
                                    <MenuItem key={value} value={value}>{value}</MenuItem>
                                )
                            }
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={2} className={classes.formGrid}>
                    <FormControl>
                        <InputLabel>Treatment</InputLabel>
                        {/* ToDo refactoring */}
                        <Select
                            variant="filled"
                            multiple
                            displayEmpty
                            value={search.treatment}
                            onChange={e => selectSwitch(e, 'treatment', treatment)}
                            autoWidth
                            renderValue={selected => selected.map(x => x).join(', ')}
                        >
                            <MenuItem value='all' className={classes.allMenu}>Select all</MenuItem>
                            {
                                treatment.map(value =>
                                    <MenuItem key={value} value={value}>{value}</MenuItem>
                                )
                            }
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={2} className={classes.formGrid}>
                    <FormControl>
                        <InputLabel>Risk</InputLabel>
                        {/* ToDo refactoring */}
                        <Select
                            variant="filled"
                            multiple
                            displayEmpty
                            value={search.risk}
                            onChange={e => selectSwitch(e, 'risk', risk)}
                            autoWidth
                            renderValue={selected => selected.map(x => x).join(', ')}
                        >
                            <MenuItem value='all' className={classes.allMenu}>Select all</MenuItem>
                            {
                                risk.map(value =>
                                    <MenuItem key={value} value={value}>{capitalizeFirstLetter(value)}</MenuItem>
                                )
                            }
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={2} className={classes.formGrid}>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <DateMultiPicker
                            utils={new DateFnsUtils()}
                            keyboard={false}
                            label="Date range"
                            format="dd/MM/yyyy"
                            mask={value => (value ? [/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/] : [])}
                            value={date}
                            onChange={setDate}
                            disableOpenOnEnter
                            animateYearScrolling={false}
                            maxDate={new Date()}
                            emptyLabel={''}
                            labelFunc={null}
                        />
                    </MuiPickersUtilsProvider>
                </Grid>

                <Grid item xs={1} />
            </Grid>
            <br />


            <Grid container spacing={0} direction="row" >
                <Grid item xs={1} />

                <Grid item xs={10} className={classes.formGrid}>

                    <Paper className={classes.paper} elevation={2}>
                        <Table className={classes.table}>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center">id</TableCell>
                                    <TableCell align="center">patient name</TableCell>
                                    <TableCell align="center">email</TableCell>
                                    <TableCell align="center">organisation</TableCell>
                                    <TableCell align="center">date added</TableCell>
                                    <TableCell align="center"></TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {
                                    report && !loading && !error && report.map(
                                        // ToDo Loader
                                        // ToDo Empty
                                        // ToDo react window
                                        rep => (
                                            <TableRow hover key={rep.Id}>
                                                <TableCell align="center">{rep['Id']}</TableCell>
                                                <TableCell align="center">{rep['Name']}</TableCell>
                                                <TableCell align="center">{rep['Email']}</TableCell>
                                                <TableCell align="center">{rep['Organisation']}</TableCell>
                                                <TableCell align="center">{rep['Date']}</TableCell>
                                                <TableCell align="center">
                                                    <Button
                                                        className={classes.button}
                                                        color="primary"
                                                        variant='text'
                                                        onClick={() => { }}
                                                    >
                                                        send report</Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )
                                }

                                <LoadingRecords loading={loading} report={report} error={error} />

                            </TableBody>
                        </Table>
                    </Paper>

                </Grid>
                <Grid item xs={1} />
            </Grid>
        </NoSsr >



    )
}

export default Filters